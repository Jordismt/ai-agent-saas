import { GetOwnedBusiness } from "../../businesses/application/GetOwnedBusiness.js";
import { GetOwnedBusinessOrThrow } from "../../businesses/application/GetOwnedBusinessOrThrow.js";

import { GetBusinessPublicPage } from "../application/GetBusinessPublicPage.js";
import { UpsertBusinessPublicPage } from "../application/UpsertBusinessPublicPage.js";
import { GetPublishedBusinessPage } from "../application/GetPublishedBusinessPage.js";

import { updateBusinessPublicPageSchema } from "./updateBusinessPublicPageSchema.js";

export class BusinessPublicPageController {
  constructor({
    businessRepository,
    publicPageRepository,
    businessServiceRepository,
    businessHoursRepository,
    employeeRepository,
  }) {
    this.getOwnedBusinessOrThrow = new GetOwnedBusinessOrThrow(new GetOwnedBusiness(businessRepository));

    this.getBusinessPublicPage = new GetBusinessPublicPage(publicPageRepository);

    this.upsertBusinessPublicPage = new UpsertBusinessPublicPage(publicPageRepository);

    this.getPublishedBusinessPage = new GetPublishedBusinessPage({
      publicPageRepository,
      businessRepository,
      businessServiceRepository,
      businessHoursRepository,
      employeeRepository,
    });
  }

  async getByBusinessId(req, res, next) {
    try {
      await this.getOwnedBusinessOrThrow.execute(req.params.businessId, req.user.id);

      const page = await this.getBusinessPublicPage.execute(req.params.businessId);

      return res.json(page);
    } catch (error) {
      next(error);
    }
  }

  async upsert(req, res, next) {
    try {
      const data = updateBusinessPublicPageSchema.parse(req.body);

      await this.getOwnedBusinessOrThrow.execute(req.params.businessId, req.user.id);

      const page = await this.upsertBusinessPublicPage.execute(req.params.businessId, data);

      return res.json(page);
    } catch (error) {
      next(error);
    }
  }

  async getPublished(req, res, next) {
    try {
      const slug = String(req.params.slug || "")
        .trim()
        .toLowerCase();

      const page = await this.getPublishedBusinessPage.execute(slug);

      if (!page) {
        return res.status(404).json({
          error: "Public business page not found",
        });
      }

      return res.json(page);
    } catch (error) {
      next(error);
    }
  }
}
