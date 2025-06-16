module.exports = {
  apps: [
    {
      name: "xenonepal-server",
      script: "index.js",
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "150M",
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "development",
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 5000,
        // Email Configuration for Production
        EMAIL_USER: "xenonepal@gmail.com",
        EMAIL_PASSWORD: "kjjphtcoduqslwgt",
        EMAIL_FROM_NAME: "XenoNepal",
        SUPPORT_EMAIL: "support@xenonepal.com",
        // Production MongoDB
        MONGO_URI:
          "mongodb+srv://khadkasakar10:EAXb68VwunHfJ3E8@cluster0.xfb5c9o.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
        MONGODB_URI:
          "mongodb+srv://khadkasakar10:EAXb68VwunHfJ3E8@cluster0.xfb5c9o.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
      },
      log_file: "./logs/combined.log",
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      merge_logs: true,
    },
  ],
};
