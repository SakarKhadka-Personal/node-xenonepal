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
    },
  },
  {
    timestamps: true,
  }
);

const Setting = mongoose.model("Setting", settingSchema);
module.exports = Setting;
