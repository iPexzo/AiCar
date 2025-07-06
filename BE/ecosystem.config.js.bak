module.exports = {
  apps: [
    {
      name: "car-ai-backend",
      script: "dist/server.js",
      cwd: "./",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "development",
        PORT: 8001,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 8001,
      },
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_file: "./logs/combined.log",
      time: true,
    },
  ],
};
