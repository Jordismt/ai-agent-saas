import { GetDashboardSummary } from "../application/GetDashboardSummary.js";

export class DashboardController {
  constructor({ dashboardRepository }) {
    this.getDashboardSummary = new GetDashboardSummary(dashboardRepository);
  }

  async getSummary(req, res, next) {
    try {
      const summary = await this.getDashboardSummary.execute(req.user.id);

      return res.json(summary);
    } catch (error) {
      next(error);
    }
  }
}
