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
        NODE_ENV: "production",
        PORT: 5000,
      },
      log_file: "./logs/combined.log",
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      merge_logs: true,
    },
  ],
};
