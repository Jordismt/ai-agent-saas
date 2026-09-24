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

    this.showServices = showServices;
    this.showTeam = showTeam;
    this.showHours = showHours;
    this.showAbout = showAbout;
    this.showContact = showContact;
  }
}
