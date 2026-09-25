import { BusinessPublicPageRepository } from "../domain/BusinessPublicPageRepository.js";
import { AppError } from "../../../shared/errors/AppError.js";

export class SupabaseBusinessPublicPageRepository extends BusinessPublicPageRepository {
  constructor(supabase) {
    super();

    this.supabase = supabase;
  }

  async findByBusinessId(businessId) {
    const { data, error } = await this.supabase
      .from("business_public_pages")
      .select("*")
      .eq("business_id", businessId)
      .maybeSingle();

    if (error) {
      throw new AppError(`Failed to find business public page: ${error.message}`, 500);
    }

    return data;
  }

  async findBySlug(slug) {
    const { data, error } = await this.supabase
      .from("business_public_pages")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();

    if (error) {
      throw new AppError(`Failed to find published business page: ${error.message}`, 500);
    }

    return data;
  }

  async upsert(page) {
    const payload = {
      business_id: page.businessId,
      slug: page.slug,
      published: page.published,

      headline: page.headline,
      description: page.description,
      about: page.about,

      logo_url: page.logoUrl,
      cover_image_url: page.coverImageUrl,

      public_phone: page.publicPhone,
      public_email: page.publicEmail,
      public_address: page.publicAddress,

      instagram_url: page.instagramUrl,
      facebook_url: page.facebookUrl,
      tiktok_url: page.tiktokUrl,
      website_url: page.websiteUrl,
      maps_url: page.mapsUrl,

      show_services: page.showServices,
      show_team: page.showTeam,
      show_hours: page.showHours,
      show_about: page.showAbout,
      show_contact: page.showContact,

      theme_primary: page.themePrimary,
      theme_secondary: page.themeSecondary,
      theme_background: page.themeBackground,
      theme_surface: page.themeSurface,
      theme_text: page.themeText,
      theme_font: page.themeFont,
      theme_radius: page.themeRadius,
      theme_button_style: page.themeButtonStyle,
      theme_template: page.themeTemplate,
      theme_hero_layout: page.themeHeroLayout,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await this.supabase
      .from("business_public_pages")
      .upsert(payload, {
        onConflict: "business_id",
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new AppError("This public page URL is already being used by another business", 409);
      }

      if (error.code === "23514") {
        throw new AppError("The public page URL is not valid", 400);
      }

      throw new AppError(`Failed to save business public page: ${error.message}`, 500);
    }

    return data;
  }
}
