const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema(
  {
    appName: {
      type: String,
      required: true,
      trim: true,
    },
    appCurrency: {
      type: String,
      required: true,
      trim: true,
    },
    // SEO Settings
    seoTitle: {
      type: String,
      trim: true,
      default: "XenoNepal - Gaming Top-Ups & Subscriptions in Nepal",
    },
    seoDescription: {
      type: String,
      trim: true,
      default:
        "XenoNepal is Nepal's premier destination for gaming top-ups, digital subscriptions, and gift cards. Buy PUBG UC, Free Fire diamonds, Netflix, Amazon Prime, VPN subscriptions, and more at unbeatable prices. Experience instant delivery, secure payments, and 24/7 customer support. Join thousands of satisfied gamers across Nepal who trust XenoNepal for their digital gaming needs.",
    },
    seoKeywords: {
      type: String,
      trim: true,
      default:
        "XenoNepal, gaming topup Nepal, PUBG UC Nepal, Free Fire diamonds Nepal, Netflix subscription Nepal, Amazon Prime Nepal, VPN Nepal, gift cards Nepal, digital subscriptions Nepal, game credits Nepal, mobile legends Nepal, CODM CP Nepal, steam wallet Nepal, PlayStation cards Nepal, Xbox cards Nepal, gaming services Nepal, esports Nepal, online gaming Nepal, cheapest PUBG UC Nepal, instant delivery Nepal, secure gaming payments Nepal",
    },
    seoImage: {
      type: String,
      trim: true,
      default: "https://xenonepal.com/og-image.jpg",
    },
    seoAuthor: {
      type: String,
      trim: true,
      default: "XenoNepal Team",
    },
    siteName: {
      type: String,
      trim: true,
      default: "XenoNepal",
    },
    twitterHandle: {
      type: String,
      trim: true,
      default: "@xenonepal",
    },
    facebookUrl: {
      type: String,
      trim: true,
      default: "https://facebook.com/xenonepal",
    },
    instagramUrl: {
      type: String,
      trim: true,
      default: "https://instagram.com/xenonepal",
    },
    youtubeUrl: {
      type: String,
      trim: true,
      default: "https://youtube.com/@xenonepal",
    },
    discordUrl: {
      type: String,
      trim: true,
      default: "https://discord.gg/xenonepal",
    }, // Email Configuration
    emailSettings: {
      emailUser: {
        type: String,
        trim: true,
        default: "",
      },
      emailPassword: {
        type: String,
        trim: true,
        default: "",
      },
      emailFromName: {
        type: String,
        trim: true,
        default: "XenoNepal",
      },
      supportEmail: {
        type: String,
        trim: true,
        default: "support@xenonepal.com",
      },
      enableEmailNotifications: {
        type: Boolean,
        default: true,
      },
    },
    // Analytics & Tracking
    facebookPixelId: {
      type: String,
      trim: true,
      default: "",
    },
    googleAnalyticsId: {
      type: String,
      trim: true,
      default: "",
    },
    googleTagManagerId: {
      type: String,
      trim: true,
      default: "",
    },
    hotjarId: {
      type: String,
      trim: true,
      default: "",
    },
    // Domain & API Settings
    domainSettings: {
      productionDomain: {
        type: String,
        trim: true,
        default: "xenonepal.com",
      },
      apiBaseUrl: {
        type: String,
        trim: true,
        default: "https://xenonepal.com/api",
      },
      cdnUrl: {
        type: String,
        trim: true,
        default: "https://cdn.xenonepal.com",
      },
      enableHttps: {
        type: Boolean,
        default: true,
      },
    },
    // Payment Gateway Settings
    paymentSettings: {
      esewa: {
        merchantId: {
          type: String,
          trim: true,
          default: "",
        },
        secretKey: {
          type: String,
          trim: true,
          default: "",
        },
        enabled: {
          type: Boolean,
          default: false,
        },
      },
      khalti: {
        publicKey: {
          type: String,
          trim: true,
          default: "",
        },
        secretKey: {
          type: String,
          trim: true,
          default: "",
        },
        enabled: {
          type: Boolean,
          default: false,
        },
      },
      paypal: {
        clientId: {
          type: String,
          trim: true,
          default: "",
        },
        clientSecret: {
          type: String,
          trim: true,
          default: "",
        },
        enabled: {
          type: Boolean,
          default: false,
        },
      },
    },
    // Third Party Integrations
    integrations: {
      recaptcha: {
        siteKey: {
          type: String,
          trim: true,
          default: "",
        },
        secretKey: {
          type: String,
          trim: true,
          default: "",
        },
        enabled: {
          type: Boolean,
          default: false,
        },
      },
      whatsapp: {
        phoneNumber: {
          type: String,
          trim: true,
          default: "+977-9876543210",
        },
        enabled: {
          type: Boolean,
          default: true,
        },
      },
      telegram: {
        botToken: {
          type: String,
          trim: true,
          default: "",
        },
        chatId: {
          type: String,
          trim: true,
          default: "",
        },
        enabled: {
          type: Boolean,
          default: false,
        },
      },
    },
    // Site Configuration
    siteConfig: {
      maintenanceMode: {
        type: Boolean,
        default: false,
      },
      allowRegistration: {
        type: Boolean,
        default: true,
      },
      requireEmailVerification: {
        type: Boolean,
        default: true,
      },
      maxOrdersPerDay: {
        type: Number,
        default: 50,
      },
      autoApproveOrders: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

const Setting = mongoose.model("Setting", settingSchema);
module.exports = Setting;
