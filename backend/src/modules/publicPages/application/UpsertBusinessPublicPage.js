import { BusinessPublicPage } from "../domain/BusinessPublicPage.js";

export class UpsertBusinessPublicPage {
  constructor(publicPageRepository) {
    this.publicPageRepository = publicPageRepository;
  }

  async execute(businessId, data) {
    const page = new BusinessPublicPage({
      businessId,

      slug: data.slug,
      published: data.published,

      headline: data.headline ?? null,
      description: data.description ?? null,
      about: data.about ?? null,

      logoUrl: data.logoUrl ?? null,
      coverImageUrl: data.coverImageUrl ?? null,

      publicPhone: data.publicPhone ?? null,
      publicEmail: data.publicEmail ?? null,
      publicAddress: data.publicAddress ?? null,

      instagramUrl: data.instagramUrl ?? null,
      facebookUrl: data.facebookUrl ?? null,
      tiktokUrl: data.tiktokUrl ?? null,
      websiteUrl: data.websiteUrl ?? null,
      mapsUrl: data.mapsUrl ?? null,

      themePrimary: data.themePrimary,
      themeSecondary: data.themeSecondary,
      themeBackground: data.themeBackground,
      themeSurface: data.themeSurface,
      themeText: data.themeText,
      themeFont: data.themeFont,
      themeRadius: data.themeRadius,
      themeButtonStyle: data.themeButtonStyle,
      themeTemplate: data.themeTemplate,
      themeHeroLayout: data.themeHeroLayout,
      showServices: data.showServices,
      showTeam: data.showTeam,
      showHours: data.showHours,
      showAbout: data.showAbout,
      showContact: data.showContact,
    });

    return this.publicPageRepository.upsert(page);
  }
}
