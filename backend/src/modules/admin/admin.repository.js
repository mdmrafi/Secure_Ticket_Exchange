import { User } from '../users/user.model.js';
import { Asset } from '../assets/asset.model.js';
import { Listing } from '../listings/listing.model.js';
import { Transaction } from '../transactions/transaction.model.js';
import { Report } from '../reports/report.model.js';

export class AdminRepository {
  async getPlatformMetrics() {
    const [totalUsers, totalAssets, activeListings, totalTransactions, pendingReports] = await Promise.all([
      User.countDocuments(),
      Asset.countDocuments(),
      Listing.countDocuments({ status: 'ACTIVE' }),
      Transaction.countDocuments(),
      Report.countDocuments({ status: 'PENDING' }),
    ]);

    return {
      totalUsers,
      totalAssets,
      activeListings,
      totalTransactions,
      pendingReports,
    };
  }
}

export const adminRepository = new AdminRepository();
