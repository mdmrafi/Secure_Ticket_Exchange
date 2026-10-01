/**
 * Generic Asset Exchange Platform Test Suite
 *
 * Validates the provider/plugin-oriented architecture:
 * 1. Interface contract implementation across all 4 initial asset types:
 *    - RAILWAY_TICKET
 *    - BUS_TICKET
 *    - EVENT_TICKET
 *    - DOCUMENT
 *    Each implementing: AssetMetadata, AssetValidator, AssetVerifier, TransferPolicy, TransferProvider
 * 2. Decoupled marketplace (no asset-specific logic in core services)
 * 3. Zero-touch pluggability: Dynamic addition of a 5th asset type (HOTEL_VOUCHER) at runtime
 * 4. End-to-end lifecycle for 2nd asset type (BUS_TICKET) with anti-scalping & transfer re-issuance
 * 5. End-to-end lifecycle for 3rd asset type (EVENT_TICKET) with dynamic QR code re-issuance
 * 6. Legal transferability enforcement for 4th asset type (DOCUMENT)
 */

import mongoose from 'mongoose';
import { env } from '../src/config/env.config.js';
import { logger } from '../src/config/logger.config.js';
import { User } from '../src/modules/users/user.model.js';
import { Asset } from '../src/modules/assets/asset.model.js';
import { Listing } from '../src/modules/listings/listing.model.js';
import { Transaction } from '../src/modules/transactions/transaction.model.js';
import { Reservation } from '../src/modules/listings/reservation.model.js';
import {
  AssetTypes,
  AssetStatus,
  ListingStatus,
  VerificationStatus,
  TransactionStatus,
  PaymentStatus,
} from '../src/common/constants/asset-types.constant.js';
import {
  assetAdapterRegistry,
  registerAssetAdapter,
  getAssetAdapter,
  hasAssetAdapter,
  getSupportedAssetTypes,
  AssetAdapter,
  AssetMetadata,
  AssetValidator,
  AssetVerifier,
  TransferPolicy,
  TransferProvider,
} from '../src/modules/assets/adapters/index.js';
import { AssetService } from '../src/modules/assets/asset.service.js';
import { ListingService } from '../src/modules/listings/listing.service.js';
import { VerificationService } from '../src/modules/verification/verification.service.js';
import { TransferService } from '../src/modules/transfers/transfer.service.js';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✔ PASS: ${message}`);
  } else {
    failedTests++;
    console.error(`  ✖ FAIL: ${message}`);
  }
}

async function runTests() {
  console.log('======================================================================');
  console.log('  GENERIC ASSET EXCHANGE PLATFORM ARCHITECTURE TEST SUITE             ');
  console.log('======================================================================\n');

  await mongoose.connect(env.MONGODB_URI);
  console.log('ℹ Connected to MongoDB Atlas for generic asset tests\n');

  const assetService = new AssetService();
  const listingService = new ListingService();
  const verificationService = new VerificationService();
  const transferService = new TransferService();

  // Clean slate test fixtures
  const testRunId = Date.now().toString().slice(-6);
  const seller = await User.create({
    email: `seller_asset_${testRunId}@example.com`,
    passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
    name: 'Generic Seller',
    role: 'USER',
    accountStatus: 'ACTIVE',
    kycStatus: 'VERIFIED',
  });

  const buyer = await User.create({
    email: `buyer_asset_${testRunId}@example.com`,
    passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
    name: 'Generic Buyer',
    role: 'USER',
    accountStatus: 'ACTIVE',
    kycStatus: 'VERIFIED',
  });

  try {
    // ------------------------------------------------------------------------
    // SCENARIO 1: Unified Contract Compliance for 4 Initial Asset Types
    // ------------------------------------------------------------------------
    console.log('Scenario 1: Adapter Contract Compliance for 4 Initial Asset Types');
    const initialTypes = [
      AssetTypes.RAILWAY_TICKET,
      AssetTypes.BUS_TICKET,
      AssetTypes.EVENT_TICKET,
      AssetTypes.DOCUMENT,
    ];

    for (const type of initialTypes) {
      assert(hasAssetAdapter(type), `AssetAdapter registered for ${type}`);
      const adapter = getAssetAdapter(type);
      assert(adapter instanceof AssetAdapter, `${type} adapter extends AssetAdapter base`);
      assert(adapter.metadata instanceof AssetMetadata, `${type} implements AssetMetadata`);
      assert(adapter.validator instanceof AssetValidator, `${type} implements AssetValidator`);
      assert(adapter.verifier instanceof AssetVerifier, `${type} implements AssetVerifier`);
      assert(adapter.transferPolicy instanceof TransferPolicy, `${type} implements TransferPolicy`);
      assert(
        adapter.transferProvider instanceof TransferProvider,
        `${type} implements TransferProvider`
      );

      // Verify contract methods existence
      assert(
        typeof adapter.metadata.normalize === 'function',
        `${type} metadata.normalize() exists`
      );
      assert(
        typeof adapter.metadata.generateIdentifier === 'function',
        `${type} metadata.generateIdentifier() exists`
      );
      assert(
        typeof adapter.validator.validateAsset === 'function',
        `${type} validator.validateAsset() exists`
      );
      assert(
        typeof adapter.validator.validateListing === 'function',
        `${type} validator.validateListing() exists`
      );
      assert(typeof adapter.verifier.verify === 'function', `${type} verifier.verify() exists`);
      assert(
        typeof adapter.transferPolicy.isTransferable === 'function',
        `${type} transferPolicy.isTransferable() exists`
      );
      assert(
        typeof adapter.transferPolicy.validateListingPrice === 'function',
        `${type} transferPolicy.validateListingPrice() exists`
      );
      assert(
        typeof adapter.transferProvider.transfer === 'function',
        `${type} transferProvider.transfer() exists`
      );
    }

    // ------------------------------------------------------------------------
    // SCENARIO 2: Zero-Touch Pluggability - Register 5th Asset Type (HOTEL_VOUCHER)
    // ------------------------------------------------------------------------
    console.log('\nScenario 2: Dynamic Pluggability (Adding 5th Asset Type: HOTEL_VOUCHER)');

    class HotelVoucherMetadata extends AssetMetadata {
      constructor() {
        super('HOTEL_VOUCHER');
      }
      normalize(raw) {
        return {
          ...raw,
          hotelName: raw.hotelName || 'Luxury Resort',
          checkIn: raw.checkIn || '2026-12-01',
          checkOut: raw.checkOut || '2026-12-05',
          roomType: raw.roomType || 'Deluxe Suite',
          voucherCode: raw.voucherCode || `HTL-${Date.now()}`,
        };
      }
      generateIdentifier(meta) {
        return `HTL-${meta.voucherCode}`;
      }
      generateTitle(meta) {
        return `Hotel Stay: ${meta.hotelName} (${meta.roomType})`;
      }
    }

    class HotelVoucherValidator extends AssetValidator {
      constructor() {
        super('HOTEL_VOUCHER');
      }
      validateAsset(data) {
        const errors = [];
        if (!data.metadata?.hotelName) errors.push('Hotel name is required');
        return { valid: errors.length === 0, errors };
      }
      validateListing(asset, listing) {
        const errors = [];
        if (Number(listing.askingPrice) <= 0) errors.push('Asking price must be positive');
        return { valid: errors.length === 0, errors };
      }
    }

    class HotelVoucherVerifier extends AssetVerifier {
      constructor() {
        super('HOTEL_VOUCHER');
      }
      async verify(asset) {
        return {
          isVerified: true,
          status: VerificationStatus.VERIFIED,
          confidenceScore: 98,
          checks: [{ checkType: 'HOTEL_CHAIN_BOOKING_VALIDATION', status: 'PASSED' }],
          fraudFlags: [],
          details: { verifiedPartner: 'Global Resorts Network' },
        };
      }
    }

    class HotelVoucherTransferPolicy extends TransferPolicy {
      constructor() {
        super('HOTEL_VOUCHER');
      }
      isTransferable() {
        return true;
      }
      validateListingPrice(asset, price) {
        // Max 10% discount to 10% premium allowed
        return { allowed: true, maxAllowedPrice: 15000 };
      }
    }

    class HotelVoucherTransferProvider extends TransferProvider {
      constructor() {
        super('HOTEL_PMS_INTEGRATION', 'HOTEL_VOUCHER');
      }
      async transfer(asset, from, to) {
        return {
          success: true,
          externalTransferId: `HTL-XFER-${Date.now()}`,
          updatedMetadata: { guestName: to.name, transferredAt: new Date().toISOString() },
          providerResponse: { pmsStatus: 'GUEST_NAME_UPDATED' },
        };
      }
    }

    class HotelVoucherAdapter extends AssetAdapter {
      constructor() {
        super({
          assetType: 'HOTEL_VOUCHER',
          displayName: 'Hotel Voucher',
          metadata: new HotelVoucherMetadata(),
          validator: new HotelVoucherValidator(),
          verifier: new HotelVoucherVerifier(),
          transferPolicy: new HotelVoucherTransferPolicy(),
          transferProvider: new HotelVoucherTransferProvider(),
        });
      }
    }

    // Register dynamically without modifying any marketplace code!
    registerAssetAdapter(new HotelVoucherAdapter());
    assert(
      hasAssetAdapter('HOTEL_VOUCHER'),
      'Newly registered HOTEL_VOUCHER adapter recognized by registry'
    );
    assert(
      getSupportedAssetTypes().includes('HOTEL_VOUCHER'),
      'HOTEL_VOUCHER included in supported asset types list'
    );

    // Create 5th asset type via generic AssetService
    const hotelAsset = await assetService.createAsset(seller._id, {
      assetType: 'HOTEL_VOUCHER',
      originalValue: 10000,
      currency: 'BDT',
      metadata: { hotelName: 'Radisson Blu', roomType: 'Executive Suite', voucherCode: 'RAD-9988' },
    });

    assert(
      hotelAsset._id != null,
      '5th asset type (HOTEL_VOUCHER) created successfully via AssetService'
    );
    assert(
      hotelAsset.uniqueAssetIdentifier === 'HTL-RAD-9988',
      'Identifier derived via HotelVoucherMetadata'
    );
    assert(
      hotelAsset.title === 'Hotel Stay: Radisson Blu (Executive Suite)',
      'Title formatted via HotelVoucherMetadata'
    );

    // Verify 5th asset type via generic VerificationService
    const hotelVerification = await verificationService.requestVerification(
      seller._id,
      hotelAsset._id
    );
    assert(
      hotelVerification.isVerified === true,
      '5th asset type verified via generic VerificationService'
    );
    assert(
      hotelVerification.status === VerificationStatus.VERIFIED,
      'VerificationStatus is VERIFIED'
    );

    // List 5th asset type on generic marketplace
    const hotelListing = await listingService.createListing(seller._id, {
      assetId: hotelAsset._id,
      askingPrice: 9500,
    });
    assert(
      hotelListing._id != null,
      '5th asset type listed on marketplace without rewriting ListingService'
    );
    assert(hotelListing.askingPrice === 9500, 'Listing asking price matches');

    // ------------------------------------------------------------------------
    // SCENARIO 3: End-to-End Lifecycle for 2nd Asset Type (BUS_TICKET)
    // ------------------------------------------------------------------------
    console.log('\nScenario 3: End-to-End Lifecycle for 2nd Asset Type (BUS_TICKET)');

    // 1. Create Bus Ticket Asset
    const departureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const busAsset = await assetService.createAsset(seller._id, {
      assetType: AssetTypes.BUS_TICKET,
      originalValue: 1200,
      currency: 'BDT',
      metadata: {
        operator: 'Hanif Enterprise',
        source: 'Dhaka',
        destination: "Cox's Bazar",
        departureDate,
        departureTime: '21:30',
        seatNumber: 'B3',
        busType: 'Scania Multi-Axle AC',
        ticketNumber: `HNF-${testRunId}`,
      },
    });

    assert(busAsset._id != null, 'Bus ticket asset created');
    assert(busAsset.assetType === AssetTypes.BUS_TICKET, 'Asset type is BUS_TICKET');
    assert(
      busAsset.uniqueAssetIdentifier.startsWith('BUS-HANIF-'),
      `Unique identifier normalized: ${busAsset.uniqueAssetIdentifier}`
    );
    assert(
      busAsset.title === "Hanif Enterprise: Dhaka -> Cox's Bazar",
      `Title formatted: ${busAsset.title}`
    );

    // 2. Verify Bus Ticket
    const busVerification = await verificationService.requestVerification(seller._id, busAsset._id);
    assert(busVerification.isVerified === true, 'Bus ticket verified by BusTicketVerifier');
    assert(
      busVerification.confidenceScore >= 70,
      `Verification score: ${busVerification.confidenceScore}`
    );
    assert(
      busVerification.checks.some((c) => c.checkType === 'OPERATOR_VERIFICATION'),
      'Operator validation check performed'
    );

    // 3. Test Anti-Scalping Policy on Bus Ticket (Max 10% markup over 1200 BDT = 1320 BDT)
    let scalpingBlocked = false;
    try {
      await listingService.createListing(seller._id, {
        assetId: busAsset._id,
        askingPrice: 1500, // 25% markup (illegal)
      });
    } catch (err) {
      scalpingBlocked = true;
      assert(
        err.message.includes('pricing policy') || err.message.includes('Anti-scalping'),
        `Illegal markup blocked: ${err.message}`
      );
    }
    assert(scalpingBlocked, 'Marketplace blocked scalping listing above 110% face value cap');

    // Valid price listing (108% markup = 1300 BDT)
    const busListing = await listingService.createListing(seller._id, {
      assetId: busAsset._id,
      askingPrice: 1300,
    });
    assert(busListing._id != null, 'Bus ticket listed successfully at compliant price (1300 BDT)');
    assert(busListing.status === ListingStatus.ACTIVE, 'Listing status is ACTIVE');

    // 4. Reserve Bus Ticket via Marketplace atomic reservation
    const reservation = await listingService.reserveListing(
      busListing._id.toString(),
      buyer._id.toString()
    );
    assert(reservation != null, 'Bus ticket atomically reserved on marketplace by buyer');

    // 5. Create Transaction
    const transaction = await Transaction.create({
      assetId: busAsset._id,
      listingId: busListing._id,
      buyerId: buyer._id,
      sellerId: seller._id,
      amount: 1300,
      currency: 'BDT',
      transactionStatus: TransactionStatus.PAYMENT_CONFIRMED,
      paymentStatus: PaymentStatus.PAID,
      escrowStatus: 'HELD',
    });
    assert(transaction._id != null, 'Escrow transaction initiated');

    // 6. Execute Transfer via TransferService
    const transferReq = await transferService.requestTransfer(
      {
        assetId: busAsset._id.toString(),
        fromUserId: seller._id.toString(),
        toUserId: buyer._id.toString(),
        transactionId: transaction._id.toString(),
      },
      seller._id.toString(),
      'SELLER'
    );
    assert(transferReq.status === 'REQUESTED', 'Transfer request created in REQUESTED status');

    await transferService.approveTransfer(
      transferReq._id.toString(),
      seller._id.toString(),
      'SELLER'
    );
    const completedTransfer = await transferService.executeTransfer(
      transferReq._id.toString(),
      seller._id.toString(),
      {},
      'ADMIN'
    );

    assert(completedTransfer.status === 'COMPLETED', 'Transfer transitioned to COMPLETED');
    assert(
      completedTransfer.providerTransferId.startsWith('BUS-XFER-'),
      'Provider transfer ID generated'
    );

    // Verify Asset Ownership updated
    const updatedBusAsset = await Asset.findById(busAsset._id);
    assert(
      updatedBusAsset.ownerId.toString() === buyer._id.toString(),
      'Bus ticket ownership transferred to buyer'
    );
    assert(
      updatedBusAsset.status === AssetStatus.TRANSFERRED,
      'Asset status updated to TRANSFERRED'
    );
    assert(
      updatedBusAsset.metadata.passengerName === buyer.name,
      'Passenger name updated to buyer'
    );
    assert(
      updatedBusAsset.metadata.ticketNumber.startsWith('ETKT-HAN-'),
      'New electronic ticket number issued'
    );
    assert(updatedBusAsset.metadata.barcode.startsWith('BC-BUS-'), 'New dynamic barcode generated');

    // ------------------------------------------------------------------------
    // SCENARIO 4: End-to-End Lifecycle for 3rd Asset Type (EVENT_TICKET)
    // ------------------------------------------------------------------------
    console.log('\nScenario 4: End-to-End Lifecycle for 3rd Asset Type (EVENT_TICKET)');

    const eventDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const eventAsset = await assetService.createAsset(seller._id, {
      assetType: AssetTypes.EVENT_TICKET,
      originalValue: 5000,
      currency: 'BDT',
      metadata: {
        eventName: 'Coldplay: Music of the Spheres',
        venue: 'National Stadium, Dhaka',
        eventDate,
        ticketTier: 'VIP Platinum',
        section: 'Front Stage',
        row: 'A',
        seat: '12',
        barcode: `BC-COLDPLAY-${testRunId}`,
        organizer: 'LiveNation Global',
      },
    });

    assert(eventAsset._id != null, 'Event ticket asset created');
    assert(
      eventAsset.uniqueAssetIdentifier.startsWith('EVENT-COLDPL-'),
      `Identifier: ${eventAsset.uniqueAssetIdentifier}`
    );

    // Verify Event Ticket
    const eventVerification = await verificationService.requestVerification(
      seller._id,
      eventAsset._id
    );
    assert(eventVerification.isVerified === true, 'Event ticket verified by EventTicketVerifier');

    // Test Anti-Scalping Policy on Event Ticket (Max 20% markup = 6000 BDT)
    let eventScalpingBlocked = false;
    try {
      await listingService.createListing(seller._id, {
        assetId: eventAsset._id,
        askingPrice: 7500, // 50% markup (illegal)
      });
    } catch (err) {
      eventScalpingBlocked = true;
      assert(
        err.message.toLowerCase().includes('anti-scalping') ||
          err.message.includes('cannot exceed'),
        `Event markup violation rejected: ${err.message}`
      );
    }
    assert(eventScalpingBlocked, 'Marketplace blocked event ticket scalping (> 120% face value)');

    // Compliant listing (110% = 5500 BDT)
    const eventListing = await listingService.createListing(seller._id, {
      assetId: eventAsset._id,
      askingPrice: 5500,
    });
    assert(eventListing._id != null, 'Event ticket listed at compliant price (5500 BDT)');

    // Execute transfer & dynamic QR re-issuance
    const eventTransferReq = await transferService.requestTransfer(
      {
        assetId: eventAsset._id.toString(),
        fromUserId: seller._id.toString(),
        toUserId: buyer._id.toString(),
      },
      seller._id.toString(),
      'SELLER'
    );
    await transferService.approveTransfer(
      eventTransferReq._id.toString(),
      seller._id.toString(),
      'SELLER'
    );
    const completedEventTransfer = await transferService.executeTransfer(
      eventTransferReq._id.toString(),
      seller._id.toString(),
      {},
      'ADMIN'
    );

    assert(completedEventTransfer.status === 'COMPLETED', 'Event transfer completed');
    const updatedEventAsset = await Asset.findById(eventAsset._id);
    assert(
      updatedEventAsset.ownerId.toString() === buyer._id.toString(),
      'Event ticket transferred to buyer'
    );
    assert(
      updatedEventAsset.metadata.ticketHolder === buyer.name,
      'Ticket holder name updated to buyer'
    );
    assert(
      updatedEventAsset.metadata.barcode.startsWith('DYN-QR-'),
      `New dynamic QR code issued: ${updatedEventAsset.metadata.barcode}`
    );
    assert(
      updatedEventAsset.metadata.invalidatedBarcodes.includes(`BC-COLDPLAY-${testRunId}`),
      'Previous barcode added to invalidated revocation list'
    );

    // ------------------------------------------------------------------------
    // SCENARIO 5: Legal Policy Enforcement for 4th Asset Type (DOCUMENT)
    // ------------------------------------------------------------------------
    console.log('\nScenario 5: Legal Policy Enforcement for 4th Asset Type (DOCUMENT)');

    // 1. Attempt to create and list an illegal non-transferable Government Identity document
    const idDocAsset = await assetService.createAsset(seller._id, {
      assetType: AssetTypes.DOCUMENT,
      originalValue: 0,
      metadata: {
        documentCategory: 'NATIONAL_IDENTITY_CARD',
        issuer: 'Election Commission',
        documentNumber: `NID-${testRunId}`,
      },
    });

    const idDocVerification = await verificationService.requestVerification(
      seller._id,
      idDocAsset._id
    );
    assert(
      idDocVerification.isVerified === false,
      'Personal identity document failed verification'
    );
    assert(
      idDocVerification.fraudFlags.some((f) => f.code === 'NON_TRANSFERABLE_ID_DOC'),
      'Flagged as NON_TRANSFERABLE_ID_DOC'
    );

    let idListingBlocked = false;
    try {
      await listingService.createListing(seller._id, {
        assetId: idDocAsset._id,
        askingPrice: 500,
      });
    } catch (err) {
      idListingBlocked = true;
      assert(
        err.message.includes(
          'Personal identity documents and government records cannot be listed'
        ) ||
          err.message.includes('verification requirements') ||
          err.message.includes('non-transferable') ||
          err.message.includes('cannot be listed'),
        `ID doc listing blocked: ${err.message}`
      );
    }
    assert(idListingBlocked, 'Marketplace strictly blocks non-transferable identity documents');

    // 2. Transferable legal document (e.g. Corporate Travel Voucher)
    const validUntil = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const voucherDocAsset = await assetService.createAsset(seller._id, {
      assetType: AssetTypes.DOCUMENT,
      originalValue: 2500,
      currency: 'BDT',
      metadata: {
        documentCategory: 'TRANSFERABLE_VOUCHER',
        issuer: 'Apex Travel Group',
        documentNumber: `VCH-${testRunId}`,
        validUntil,
      },
    });

    const voucherVerification = await verificationService.requestVerification(
      seller._id,
      voucherDocAsset._id
    );
    assert(voucherVerification.isVerified === true, 'Transferable voucher verified successfully');

    const voucherListing = await listingService.createListing(seller._id, {
      assetId: voucherDocAsset._id,
      askingPrice: 2400,
    });
    assert(voucherListing._id != null, 'Transferable voucher listed on marketplace');

    // Transfer voucher & digital notary deed execution
    const docTransferReq = await transferService.requestTransfer(
      {
        assetId: voucherDocAsset._id.toString(),
        fromUserId: seller._id.toString(),
        toUserId: buyer._id.toString(),
      },
      seller._id.toString(),
      'SELLER'
    );
    await transferService.approveTransfer(
      docTransferReq._id.toString(),
      seller._id.toString(),
      'SELLER'
    );
    const completedDocTransfer = await transferService.executeTransfer(
      docTransferReq._id.toString(),
      seller._id.toString(),
      {},
      'ADMIN'
    );

    assert(completedDocTransfer.status === 'COMPLETED', 'Document transfer completed');
    const updatedDocAsset = await Asset.findById(voucherDocAsset._id);
    assert(
      updatedDocAsset.ownerId.toString() === buyer._id.toString(),
      'Document legal rights transferred to buyer'
    );
    assert(updatedDocAsset.metadata.legalHolder === buyer.name, 'Legal holder recorded as buyer');
    assert(
      typeof updatedDocAsset.metadata.digitalTransferSignature === 'string',
      'Cryptographic digital notary signature generated'
    );
    assert(
      updatedDocAsset.metadata.transferNotaryId.startsWith('DOC-NOTARY-'),
      'Notary deed identifier assigned'
    );
  } finally {
    // Cleanup fixtures
    await User.deleteMany({ _id: { $in: [seller._id, buyer._id] } });
    await Asset.deleteMany({ ownerId: { $in: [seller._id, buyer._id] } });
    await Listing.deleteMany({ sellerId: seller._id });
    await Transaction.deleteMany({ $or: [{ buyerId: buyer._id }, { sellerId: seller._id }] });
    await Reservation.deleteMany({ buyerId: buyer._id });
    await mongoose.disconnect();
    console.log('\nℹ Cleaned up test fixtures & disconnected from database');
  }

  console.log('\n======================================================================');
  console.log(`TEST SUMMARY: ${passedTests} passed, ${failedTests} failed (Total: ${totalTests})`);
  console.log('======================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test suite failed with unexpected error:', err);
  process.exit(1);
});
