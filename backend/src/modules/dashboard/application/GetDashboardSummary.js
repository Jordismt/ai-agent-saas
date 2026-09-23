export class GetDashboardSummary {
  constructor(dashboardRepository) {
    this.dashboardRepository = dashboardRepository;
  }

  async execute(userId) {
    const businesses = await this.dashboardRepository.getBusinessesByOwnerId(userId);

    if (!businesses.length) {
      return {
        stats: {
          businesses: 0,
          conversations: 0,
          leads: 0,
          upcomingBookings: 0,
        },

        attention: {
          newLeads: 0,
          humanConversations: 0,
          pendingBookings: 0,
        },

        businesses: [],
        recentActivity: [],
      };
    }

    const businessIds = businesses.map((business) => business.id);

    const [conversations, leads, bookings] = await Promise.all([
      this.dashboardRepository.getConversationsByBusinessIds(businessIds),
      this.dashboardRepository.getLeadsByBusinessIds(businessIds),
      this.dashboardRepository.getBookingsByBusinessIds(businessIds),
    ]);

    const now = new Date();

    const upcomingBookings = bookings.filter((booking) => {
      if (!["pending", "confirmed"].includes(booking.status)) {
        return false;
      }

      return new Date(booking.starts_at) >= now;
    });

    const newLeads = leads.filter((lead) => lead.status === "new");

    const humanConversations = conversations.filter((conversation) => conversation.status === "human");

    const pendingBookings = bookings.filter(
      (booking) => booking.status === "pending" && new Date(booking.starts_at) >= now,
    );

    const businessSummaries = businesses.map((business) => {
      const businessConversations = conversations.filter(
        (conversation) => conversation.business_id === business.id,
      );

      const businessLeads = leads.filter((lead) => lead.business_id === business.id);

      const businessUpcomingBookings = upcomingBookings.filter(
        (booking) => booking.business_id === business.id,
      );

      return {
        id: business.id,
        name: business.name,
        description: business.description,
        phone: business.phone,
        address: business.address,

        conversations: businessConversations.length,
        leads: businessLeads.length,
        upcomingBookings: businessUpcomingBookings.length,

        humanConversations: businessConversations.filter((conversation) => conversation.status === "human")
          .length,

        newLeads: businessLeads.filter((lead) => lead.status === "new").length,

        pendingBookings: businessUpcomingBookings.filter((booking) => booking.status === "pending").length,
      };
    });

    const recentActivity = this.buildRecentActivity({
      businesses,
      conversations,
      leads,
      bookings,
    });

    return {
      stats: {
        businesses: businesses.length,
        conversations: conversations.length,
        leads: leads.length,
        upcomingBookings: upcomingBookings.length,
      },

      attention: {
        newLeads: newLeads.length,
        humanConversations: humanConversations.length,
        pendingBookings: pendingBookings.length,
      },

      businesses: businessSummaries,
      recentActivity,
    };
  }

  buildRecentActivity({ businesses, conversations, leads, bookings }) {
    const businessMap = new Map(businesses.map((business) => [business.id, business]));

    const conversationActivity = conversations.map((conversation) => ({
      id: `conversation-${conversation.id}`,
      entityId: conversation.id,
      businessId: conversation.business_id,
      businessName: businessMap.get(conversation.business_id)?.name || "Negocio",
      type: "conversation",
      title: "Nueva conversación",
      description: "Un cliente inició una conversación con el agente.",
      date: conversation.created_at,
    }));

    const leadActivity = leads.map((lead) => ({
      id: `lead-${lead.id}`,
      entityId: lead.id,
      businessId: lead.business_id,
      businessName: businessMap.get(lead.business_id)?.name || "Negocio",
      type: "lead",
      title: "Nuevo lead",
      description: lead.name || lead.phone || lead.email || "Nuevo contacto captado",
      date: lead.created_at,
    }));

    const bookingActivity = bookings.map((booking) => ({
      id: `booking-${booking.id}`,
      entityId: booking.id,
      businessId: booking.business_id,
      businessName: businessMap.get(booking.business_id)?.name || "Negocio",
      type: "booking",
      title: "Nueva reserva",
      description: [booking.customer_name, booking.service_name].filter(Boolean).join(" · "),
      date: booking.created_at,
    }));

    return [...conversationActivity, ...leadActivity, ...bookingActivity]
      .filter((activity) => activity.date)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 8);
  }
}
