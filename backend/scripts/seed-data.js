import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Import Models
import { User } from '../src/modules/users/user.model.js';
import { Asset } from '../src/modules/assets/asset.model.js';
import { Listing } from '../src/modules/listings/listing.model.js';
import { KYCRecord } from '../src/modules/kyc/kyc.model.js';
import { Verification } from '../src/modules/verification/verification.model.js';
import { Transaction } from '../src/modules/transactions/transaction.model.js';
import { AuditLog } from '../src/modules/audit/audit-log.model.js';
import { FraudAssessment } from '../src/modules/fraud/fraud-assessment.model.js';
import {
  AssetStatus,
  VerificationStatus,
  ListingStatus,
  TransactionStatus,
  PaymentStatus,
} from '../src/common/constants/asset-types.constant.js';

async function seedDatabase() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/secure_asset_exchange';
  console.log('Connecting to MongoDB database at:', mongoUri.split('@').pop() || mongoUri);

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB successfully.');

  try {
    console.log('Cleaning up existing database records...');
    await Promise.all([
      User.deleteMany({}),
      Asset.deleteMany({}),
      Listing.deleteMany({}),
      KYCRecord.deleteMany({}),
      Verification.deleteMany({}),
      Transaction.deleteMany({}),
      AuditLog.deleteMany({}),
      FraudAssessment.deleteMany({}),
    ]);
    console.log('Old records cleaned.');

    console.log('Generating password hashes (Password123!)...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Password123!', salt);

    // 1. Create Core Users
    console.log('Creating core users...');
    const users = await User.create([
      {
        name: 'Chief Security Officer',
        email: 'admin@safepass.com',
        phone: '+880 1700-000001',
        passwordHash,
        role: 'ADMIN',
        accountStatus: 'ACTIVE',
        emailVerified: true,
        kycStatus: 'VERIFIED',
        kycVerifiedAt: new Date(),
        trustScore: 100,
      },
      {
        name: 'Compliance Moderator',
        email: 'moderator@safepass.com',
        phone: '+880 1700-000002',
        passwordHash,
        role: 'MODERATOR',
        accountStatus: 'ACTIVE',
        emailVerified: true,
        kycStatus: 'VERIFIED',
        kycVerifiedAt: new Date(),
        trustScore: 98,
      },
      {
        name: 'Tanvir Hossain',
        email: 'user@safepass.com',
        phone: '+880 1711-234567',
        passwordHash,
        role: 'USER',
        accountStatus: 'ACTIVE',
        emailVerified: true,
        kycStatus: 'VERIFIED',
        kycVerifiedAt: new Date(),
        trustScore: 96,
      },
      {
        name: 'Mahmudur Rahman',
        email: 'seller@safepass.com',
        phone: '+880 1819-876543',
        passwordHash,
        role: 'USER',
        accountStatus: 'ACTIVE',
        emailVerified: true,
        kycStatus: 'VERIFIED',
        kycVerifiedAt: new Date(),
        trustScore: 99,
      },
      {
        name: 'Rashidul Karim',
        email: 'unverified@safepass.com',
        phone: '+880 1912-345678',
        passwordHash,
        role: 'USER',
        accountStatus: 'ACTIVE',
        emailVerified: true,
        kycStatus: 'NOT_STARTED',
        trustScore: 75,
      },
      {
        name: 'Farhana Ahmed',
        email: 'buyer@safepass.com',
        phone: '+880 1622-998877',
        passwordHash,
        role: 'USER',
        accountStatus: 'ACTIVE',
        emailVerified: true,
        kycStatus: 'VERIFIED',
        kycVerifiedAt: new Date(),
        trustScore: 95,
      },
    ]);

    const [admin, moderator, user, seller, unverified, buyer] = users;
    console.log(`Created ${users.length} users successfully.`);

    // 2. Create KYC Records
    console.log('Seeding KYC records...');
    await KYCRecord.create([
      {
        userId: user._id,
        status: 'VERIFIED',
        provider: 'mock',
        providerReferenceId: 'KYC-MOCK-9012',
        documentType: 'NATIONAL_ID',
        documentNumberMasked: '•••• •••• 9012',
        verificationLevel: 'TIER_2_ENHANCED',
        submittedAt: new Date(Date.now() - 86400000 * 5),
        verifiedAt: new Date(Date.now() - 86400000 * 4),
        reviewNotes: 'Smart NID 10-digit checksum and passive biometric liveness match verified.',
      },
      {
        userId: seller._id,
        status: 'VERIFIED',
        provider: 'mock',
        providerReferenceId: 'KYC-MOCK-4410',
        documentType: 'PASSPORT',
        documentNumberMasked: '•••• 4410',
        verificationLevel: 'TIER_2_ENHANCED',
        submittedAt: new Date(Date.now() - 86400000 * 10),
        verifiedAt: new Date(Date.now() - 86400000 * 9),
        reviewNotes: 'Machine Readable Zone (MRZ) characters validated against central registry.',
      },
      {
        userId: unverified._id,
        status: 'PENDING',
        provider: 'mock',
        providerReferenceId: 'KYC-MOCK-8812',
        documentType: 'NATIONAL_ID',
        documentNumberMasked: '•••• •••• 8812',
        verificationLevel: 'TIER_1_STANDARD',
        submittedAt: new Date(Date.now() - 3600000 * 2),
        reviewNotes: 'Awaiting compliance officer visual inspection of document lighting contrast.',
      },
    ]);

    // 3. Create Multi-Asset Records
    console.log('Seeding verifiable assets...');
    const assets = await Asset.create([
      // Asset 1: Railway - Suborno Express
      {
        ownerId: seller._id,
        assetType: 'RAILWAY_TICKET',
        status: AssetStatus.ACTIVE,
        verificationStatus: VerificationStatus.VERIFIED,
        title: 'Suborno Express (701): Dhaka -> Chittagong',
        description: 'Direct Non-Stop Intercity Express, Snigdha AC Chair Coach Cha Seat 14',
        uniqueAssetIdentifier: 'RAIL-PNR-7819204123',
        originalValue: 805,
        currency: 'BDT',
        verifiedAt: new Date(),
        isTransferable: true,
        metadata: {
          pnr: '7819204123',
          trainNumber: '701',
          trainName: 'Suborno Express',
          source: 'Dhaka',
          fromStation: 'Dhaka (Kamalapur)',
          destination: 'Chittagong',
          toStation: 'Chittagong Railway Station',
          journeyDate: '2026-10-14',
          departureDate: '2026-10-14',
          departureTime: '07:00 AM',
          travelClass: 'Snigdha (AC Chair)',
          class: 'Snigdha AC Chair',
          coach: 'Cha',
          seatNumber: '14',
          seat: 'Cha-14',
          passengerName: 'M. Rahman',
          faceValue: 805,
        },
      },
      // Asset 2: Railway - Parabat Express
      {
        ownerId: user._id,
        assetType: 'RAILWAY_TICKET',
        status: AssetStatus.ACTIVE,
        verificationStatus: VerificationStatus.VERIFIED,
        title: 'Parabat Express (709): Dhaka -> Sylhet',
        description: 'Morning Scenic Mountain Foothills Route, Shovon Chair Coach Ka Seat 22',
        uniqueAssetIdentifier: 'RAIL-PNR-8901234567',
        originalValue: 365,
        currency: 'BDT',
        verifiedAt: new Date(),
        isTransferable: true,
        metadata: {
          pnr: '8901234567',
          trainNumber: '709',
          trainName: 'Parabat Express',
          source: 'Dhaka',
          fromStation: 'Dhaka (Kamalapur)',
          destination: 'Sylhet',
          toStation: 'Sylhet Railway Station',
          journeyDate: '2026-10-15',
          departureDate: '2026-10-15',
          departureTime: '06:20 AM',
          travelClass: 'Shovon Chair',
          class: 'Shovon Chair',
          coach: 'Ka',
          seatNumber: '22',
          seat: 'Ka-22',
          passengerName: 'T. Hossain',
          faceValue: 365,
        },
      },
      // Asset 3: Railway - Sonar Bangla Express
      {
        ownerId: seller._id,
        assetType: 'RAILWAY_TICKET',
        status: AssetStatus.ACTIVE,
        verificationStatus: VerificationStatus.VERIFIED,
        title: 'Sonar Bangla Express (787): Dhaka -> Chittagong',
        description: 'Premier High-Speed Intercity Express, Snigdha AC Chair Coach Ga Seat 08',
        uniqueAssetIdentifier: 'RAIL-PNR-9123456789',
        originalValue: 805,
        currency: 'BDT',
        verifiedAt: new Date(),
        isTransferable: true,
        metadata: {
          pnr: '9123456789',
          trainNumber: '787',
          trainName: 'Sonar Bangla Express',
          source: 'Dhaka',
          fromStation: 'Dhaka (Kamalapur)',
          destination: 'Chittagong',
          toStation: 'Chittagong Railway Station',
          journeyDate: '2026-10-16',
          departureDate: '2026-10-16',
          departureTime: '05:00 PM',
          travelClass: 'Snigdha (AC Chair)',
          class: 'Snigdha AC Chair',
          coach: 'Ga',
          seatNumber: '08',
          seat: 'Ga-08',
          passengerName: 'M. Rahman',
          faceValue: 805,
        },
      },
      // Asset 4: Railway - Silk City Express
      {
        ownerId: seller._id,
        assetType: 'RAILWAY_TICKET',
        status: AssetStatus.ACTIVE,
        verificationStatus: VerificationStatus.VERIFIED,
        title: 'Silk City Express (753): Dhaka -> Rajshahi',
        description:
          'Afternoon Intercity via Bangabandhu Bridge, Snigdha AC Chair Coach Kha Seat 19',
        uniqueAssetIdentifier: 'RAIL-PNR-6543210987',
        originalValue: 625,
        currency: 'BDT',
        verifiedAt: new Date(),
        isTransferable: true,
        metadata: {
          pnr: '6543210987',
          trainNumber: '753',
          trainName: 'Silk City Express',
          source: 'Dhaka',
          fromStation: 'Dhaka (Kamalapur)',
          destination: 'Rajshahi',
          toStation: 'Rajshahi Railway Station',
          journeyDate: '2026-10-18',
          departureDate: '2026-10-18',
          departureTime: '02:45 PM',
          travelClass: 'Snigdha (AC Chair)',
          class: 'Snigdha AC Chair',
          coach: 'Kha',
          seatNumber: '19',
          seat: 'Kha-19',
          passengerName: 'M. Rahman',
          faceValue: 625,
        },
      },
      // Asset 5: Bus - Green Line Paribahan
      {
        ownerId: seller._id,
        assetType: 'BUS_TICKET',
        status: AssetStatus.ACTIVE,
        verificationStatus: VerificationStatus.VERIFIED,
        title: "Green Line Paribahan: Dhaka -> Cox's Bazar",
        description: 'Scania Multi-Axle Business Class Sleeper Coach, Seat A1',
        uniqueAssetIdentifier: 'BUS-GL-CXB-99812',
        originalValue: 1600,
        currency: 'BDT',
        verifiedAt: new Date(),
        isTransferable: true,
        metadata: {
          ticketNumber: 'GL-CXB-99812',
          operator: 'Green Line Paribahan',
          busType: 'Scania Multi-Axle AC Sleeper',
          source: 'Dhaka',
          fromStation: 'Arambagh Counter',
          destination: "Cox's Bazar",
          toStation: 'Kolatoli Point',
          journeyDate: '2026-10-20',
          departureDate: '2026-10-20',
          departureTime: '10:30 PM',
          class: 'Business Class Sleeper',
          seatNumber: 'A1',
          seat: 'A1',
          faceValue: 1600,
        },
      },
      // Asset 6: Bus - Hanif Enterprise
      {
        ownerId: user._id,
        assetType: 'BUS_TICKET',
        status: AssetStatus.ACTIVE,
        verificationStatus: VerificationStatus.VERIFIED,
        title: 'Hanif Enterprise: Dhaka -> Rajshahi',
        description: 'Hyundai Universe Express Air-Conditioned Coach, Seat B3',
        uniqueAssetIdentifier: 'BUS-HNF-RAJ-4412',
        originalValue: 950,
        currency: 'BDT',
        verifiedAt: new Date(),
        isTransferable: true,
        metadata: {
          ticketNumber: 'HNF-RAJ-4412',
          operator: 'Hanif Enterprise',
          busType: 'Hyundai Universe AC',
          source: 'Dhaka',
          fromStation: 'Gabtoli Terminal',
          destination: 'Rajshahi',
          toStation: 'Shiroil Bus Terminal',
          journeyDate: '2026-10-22',
          departureDate: '2026-10-22',
          departureTime: '08:00 AM',
          class: 'AC Chair Coach',
          seatNumber: 'B3',
          seat: 'B3',
          faceValue: 950,
        },
      },
      // Asset 7: Event Ticket - Coldplay Live in Concert
      {
        ownerId: seller._id,
        assetType: 'EVENT_TICKET',
        status: AssetStatus.ACTIVE,
        verificationStatus: VerificationStatus.VERIFIED,
        title: 'Coldplay: Music of the Spheres World Tour',
        description: 'VIP Golden Circle Lounge with Priority Entry Gate & Souvenir Badge',
        uniqueAssetIdentifier: 'EVENT-CP-VIP-00214',
        originalValue: 5500,
        currency: 'BDT',
        verifiedAt: new Date(),
        isTransferable: true,
        metadata: {
          ticketNumber: 'CP-VIP-00214',
          eventName: 'Coldplay: Music of the Spheres World Tour',
          venue: 'Bangladesh Army Stadium, Dhaka',
          eventDate: '2026-11-20',
          doorsOpen: '05:00 PM',
          class: 'VIP Golden Circle Lounge',
          seat: 'Row A, Seat 12',
          seatNumber: 'VIP-12',
          faceValue: 5500,
        },
      },
      // Asset 8: Document - Bangladesh Tourism Travel Voucher
      {
        ownerId: seller._id,
        assetType: 'DOCUMENT',
        status: AssetStatus.ACTIVE,
        verificationStatus: VerificationStatus.VERIFIED,
        title: 'BPC Official Hotel & Resort Travel Voucher',
        description:
          'Transferable Official Tourism Board Travel Voucher, valid across all BPC Eco-Resorts',
        uniqueAssetIdentifier: 'DOC-VCH-BPC-88910',
        originalValue: 3200,
        currency: 'BDT',
        verifiedAt: new Date(),
        isTransferable: true,
        metadata: {
          documentNumber: 'VCH-BPC-88910',
          issuer: 'Bangladesh Parjatan Corporation',
          documentType: 'Tourism Credit Voucher',
          validUntil: '2026-12-31',
          class: 'Official State Voucher',
          seat: 'Transferable Certificate',
          faceValue: 3200,
        },
      },
    ]);

    console.log(`Created ${assets.length} multi-type assets.`);

    // 4. Create Verifications for Assets
    console.log('Seeding verification audit records...');
    for (const asset of assets) {
      await Verification.create({
        assetId: asset._id,
        requestedBy: asset.ownerId,
        status: VerificationStatus.VERIFIED,
        verifierId: moderator._id,
        confidenceScore: 99.4,
        checks: [
          {
            checkType: 'DOCUMENT_READABILITY',
            status: 'PASSED',
            score: 99.8,
            details: 'ISO 300 DPI passed',
          },
          {
            checkType: 'OCR_CONSISTENCY',
            status: 'PASSED',
            score: 99.2,
            details: 'Station codes match timetable',
          },
          { checkType: 'FORMAT_SYNTAX', status: 'PASSED', score: 100, details: 'Checksum valid' },
          {
            checkType: 'DUPLICATE_CHECK',
            status: 'PASSED',
            score: 100,
            details: 'Zero hash collisions found',
          },
          {
            checkType: 'AUTHORITY_GATEWAY',
            status: 'PASSED',
            score: 98.6,
            details: 'Live PNR registry verified',
          },
        ],
        notes: 'Multi-layer automated cryptographic checks passed.',
        completedAt: new Date(),
      });
    }

    // 5. Create Marketplace Listings
    console.log('Publishing listings to the marketplace...');
    const listings = await Listing.create([
      {
        assetId: assets[0]._id, // Suborno Express
        sellerId: seller._id,
        askingPrice: 805,
        originalFaceValue: 805,
        currency: 'BDT',
        status: ListingStatus.ACTIVE,
        isEscrowProtected: true,
        expiresAt: new Date(Date.now() + 86400000 * 12),
        notes: 'Selling at official government price due to reschedule of company conference.',
      },
      {
        assetId: assets[1]._id, // Parabat Express
        sellerId: user._id,
        askingPrice: 365,
        originalFaceValue: 365,
        currency: 'BDT',
        status: ListingStatus.ACTIVE,
        isEscrowProtected: true,
        expiresAt: new Date(Date.now() + 86400000 * 13),
        notes: 'Single passenger seat, morning scenic route.',
      },
      {
        assetId: assets[2]._id, // Sonar Bangla
        sellerId: seller._id,
        askingPrice: 805,
        originalFaceValue: 805,
        currency: 'BDT',
        status: ListingStatus.ACTIVE,
        isEscrowProtected: true,
        expiresAt: new Date(Date.now() + 86400000 * 14),
        notes: 'Fastest evening express from Kamalapur.',
      },
      {
        assetId: assets[3]._id, // Silk City
        sellerId: seller._id,
        askingPrice: 625,
        originalFaceValue: 625,
        currency: 'BDT',
        status: ListingStatus.ACTIVE,
        isEscrowProtected: true,
        expiresAt: new Date(Date.now() + 86400000 * 16),
        notes: 'Non-smoking air-conditioned coach Kha.',
      },
      {
        assetId: assets[4]._id, // Green Line
        sellerId: seller._id,
        askingPrice: 1600,
        originalFaceValue: 1600,
        currency: 'BDT',
        status: ListingStatus.ACTIVE,
        isEscrowProtected: true,
        expiresAt: new Date(Date.now() + 86400000 * 18),
        notes: "Night sleeper bus to Cox's Bazar Kolatoli.",
      },
      {
        assetId: assets[5]._id, // Hanif Enterprise
        sellerId: user._id,
        askingPrice: 950,
        originalFaceValue: 950,
        currency: 'BDT',
        status: ListingStatus.ACTIVE,
        isEscrowProtected: true,
        expiresAt: new Date(Date.now() + 86400000 * 20),
        notes: 'Direct morning AC bus to Rajshahi.',
      },
      {
        assetId: assets[6]._id, // Coldplay VIP
        sellerId: seller._id,
        askingPrice: 5500,
        originalFaceValue: 5500,
        currency: 'BDT',
        status: ListingStatus.ACTIVE,
        isEscrowProtected: true,
        expiresAt: new Date(Date.now() + 86400000 * 45),
        notes: 'VIP Lounge access pass at exact face value.',
      },
      {
        assetId: assets[7]._id, // Travel Voucher
        sellerId: seller._id,
        askingPrice: 3200,
        originalFaceValue: 3200,
        currency: 'BDT',
        status: ListingStatus.ACTIVE,
        isEscrowProtected: true,
        expiresAt: new Date(Date.now() + 86400000 * 60),
        notes: 'Transferable corporate resort voucher.',
      },
    ]);

    console.log(`Created ${listings.length} active marketplace listings.`);

    // 6. Create Historical / Escrow Transactions
    console.log('Seeding transaction records...');
    await Transaction.create([
      {
        listingId: listings[0]._id,
        assetId: assets[0]._id,
        sellerId: seller._id,
        buyerId: buyer._id,
        amount: 805,
        currency: 'BDT',
        paymentStatus: PaymentStatus.PAID,
        transactionStatus: TransactionStatus.COMPLETED,
        escrowStatus: 'RELEASED',
        escrowAmount: 805,
        providerPaymentId: 'BKASH-ESCROW-9912803',
        completedAt: new Date(Date.now() - 3600000 * 4),
      },
    ]);

    // 7. Create Fraud Assessments
    console.log('Seeding fraud & risk center assessments...');
    await FraudAssessment.create([
      {
        targetType: 'ASSET',
        targetId: assets[0]._id.toString(),
        overallScore: 85,
        riskLevel: 'HIGH',
        status: 'PENDING_REVIEW',
        signals: [
          {
            code: 'DUPLICATE_DOCUMENT_FINGERPRINTS',
            name: 'Duplicate Document Fingerprints',
            triggered: true,
            severity: 'HIGH',
            score: 85,
            weight: 0.15,
            description: 'SHA-256 binary hash matches an existing archived scan.',
            explanation: 'Document was verified on original run but triggered caution alert.',
            evidence: { hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' },
          },
        ],
        summaryExplanation: 'Multiple verification attempts triggered secondary risk inspection.',
      },
    ]);

    // 8. Create System Audit Logs
    console.log('Seeding system audit ledger...');
    await AuditLog.create([
      {
        eventId: 'evt_audit_001_' + Date.now(),
        eventName: 'ASSET_VERIFICATION_COMPLETED',
        entityType: 'ASSET',
        entityId: assets[0]._id.toString(),
        actorId: 'system.ocr_engine',
        actorRole: 'SYSTEM',
        data: { pnr: '7819204123', status: 'VERIFIED', confidence: 99.4 },
        ipAddress: '10.0.4.12',
        timestamp: new Date(Date.now() - 3600000 * 5),
      },
      {
        eventId: 'evt_audit_002_' + Date.now(),
        eventName: 'KYC_MANUAL_APPROVAL',
        entityType: 'KYC',
        entityId: user._id.toString(),
        actorId: moderator._id.toString(),
        actorRole: 'MODERATOR',
        data: { applicant: 'Tanvir Hossain', documentType: 'Smart NID' },
        ipAddress: '103.114.98.2',
        timestamp: new Date(Date.now() - 3600000 * 24),
      },
      {
        eventId: 'evt_audit_003_' + Date.now(),
        eventName: 'ESCROW_PAYMENT_CAPTURED',
        entityType: 'TRANSACTION',
        entityId: listings[0]._id.toString(),
        actorId: buyer._id.toString(),
        actorRole: 'USER',
        data: { amount: 805, currency: 'BDT', provider: 'bKash Escrow' },
        ipAddress: '118.179.32.14',
        timestamp: new Date(Date.now() - 3600000 * 4),
      },
    ]);

    console.log('\n======================================================');
    console.log('DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('======================================================');
    console.log('Core Logins available (Password for all: Password123!):');
    console.log('1. Admin:       admin@safepass.com');
    console.log('2. Moderator:   moderator@safepass.com');
    console.log('3. Verified:    user@safepass.com (Tanvir Hossain)');
    console.log('4. Seller:      seller@safepass.com (Mahmudur Rahman)');
    console.log('5. Unverified:  unverified@safepass.com (Rashidul Karim)');
    console.log('6. Buyer:       buyer@safepass.com (Farhana Ahmed)');
    console.log('======================================================\n');
  } catch (err) {
    console.error('Error during seeding:', err);
    throw err;
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected cleanly.');
  }
}

seedDatabase()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
