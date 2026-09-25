export class BusinessPublicPage {
  constructor({
    id = null,
    businessId,
    slug,
    published = false,

    headline = null,
    description = null,
    about = null,

    logoUrl = null,
    coverImageUrl = null,

    publicPhone = null,
    publicEmail = null,
    publicAddress = null,

    instagramUrl = null,
    facebookUrl = null,
    tiktokUrl = null,
    websiteUrl = null,
    mapsUrl = null,

    themePrimary = "#2563eb",
    themeSecondary = "#0f172a",
    themeBackground = "#ffffff",
    themeSurface = "#f8fafc",
    themeText = "#0f172a",
    themeFont = "Inter",
    themeRadius = 14,
    themeButtonStyle = "rounded",
    themeTemplate = "editorial",
    themeHeroLayout = "split",
    showServices = true,
    showTeam = true,
    showHours = true,
    showAbout = true,
    showContact = true,
  }) {
    this.id = id;
    this.businessId = businessId;
    this.slug = slug;
    this.published = published;

    this.headline = headline;
    this.description = description;
    this.about = about;

    this.logoUrl = logoUrl;
    this.coverImageUrl = coverImageUrl;

    this.publicPhone = publicPhone;
    this.publicEmail = publicEmail;
    this.publicAddress = publicAddress;

    this.instagramUrl = instagramUrl;
    this.facebookUrl = facebookUrl;
    this.tiktokUrl = tiktokUrl;
    this.websiteUrl = websiteUrl;
    this.mapsUrl = mapsUrl;

    this.themePrimary = themePrimary;
    this.themeSecondary = themeSecondary;
    this.themeBackground = themeBackground;
    this.themeSurface = themeSurface;
    this.themeText = themeText;
    this.themeFont = themeFont;
    this.themeRadius = themeRadius;
    this.themeButtonStyle = themeButtonStyle;
    this.themeTemplate = themeTemplate;
    this.themeHeroLayout = themeHeroLayout;
    this.showServices = showServices;
    this.showTeam = showTeam;
    this.showHours = showHours;
    this.showAbout = showAbout;
    this.showContact = showContact;
  }
}
