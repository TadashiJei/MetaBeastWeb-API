module.exports = {
  version: "1.13", 

  port: 80,
  port_https: 443,
  api_title: "MetaBeast API",  //Display name
  api_url: "",                  //If you set the URL, will block all direct IP access, or wrong url access, leave blank to allow all url access

  //HTTPS config, certificate is required if you want to enable HTTPS
  https_key: "/etc/letsencrypt/live/api.metabeast.fun/privkey.pem",
  https_ca: "/etc/letsencrypt/live/api.metabeast.fun/chain.pem",
  https_cert: "/etc/letsencrypt/live/api.metabeast.fun/cert.pem",
  allow_http: true,
  allow_https: false,

  //JS Web Token Config
  jwt_secret: "JWT_123456789",     //Change this to a unique secret value
  jwt_expiration: 3600 * 10,         //In seconds  (10 hours)
  jwt_refresh_expiration: 3600 * 100, //In seconds  (100 hours)
  
  //User Permissions Config
  permissions: {
    USER: 1,
    SERVER: 5,
    ADMIN: 10,
  },

  //Mongo Connection
  mongo_user: "",
  mongo_pass: "",
  mongo_host: "localhost",
  mongo_port: "27017",
  mongo_db: "MetaBeast",

  //Limiter to protect from DDOS, will block IP that do too many requests
  limiter_window: 1000 * 120,  //in ms, will reset the counts after this time
  limiter_max: 500,           //max nb of GET requests within the time window
  limiter_post_max: 100,      //max nb of POST requests within the time window
  limiter_auth_max: 10,        //max nb of Login/Register request within the time window
  limiter_proxy: false,       //Must be set to true if your server is behind a proxy, otherwise the proxy itself will be blocked
  
  ip_whitelist: ["127.0.0.1"],  //These IP are not affected by the limiter, for example you could add your game server's IP
  ip_blacklist: [],             //These IP are blocked forever

  //Email config, required for the API to send emails
  smtp_enabled: false,
  smtp_name: "MetaBeast",    //Name of sender in emails
  smtp_email: "",           //Email used to send
  smtp_server: "",          //SMTP server URL
  smtp_port: "465",
  smtp_user: "",            //SMTP auth user
  smtp_password: "",        //SMTP auth password
  admin_email: "",          //Email to send admin notifications to

  //ELO settings
  elo_k: 32,                //Higher K number will affect elo more each match
  elo_ini_k: 128,           //K value for the first X matches can be higher
  elo_ini_match: 5,         //X number of match for the previous value

  //New Users
  start_coins: 5000,
  start_elo: 1000,

  //Match Rewards
  coins_victory: 200,       //Victory coins reward
  coins_defeat: 100,        //Defeat coins reward
  xp_victory: 100,         //Victory xp reward
  xp_defeat: 50,            //Defeat xp reward

  //Market
  sell_ratio: 0.8,          //Sell ratio compared to buy price
  avatar_cost: 500,
  cardback_cost: 1000,
  
  //Web3 Configuration
  web3_enabled: true,       //Enable Web3 functionality
  web3_use_testnet: true,   //Use Core testnet instead of mainnet
  web3_core_rpc_mainnet: "https://rpc.coredao.org",
  web3_core_rpc_testnet: "https://rpc.test.btcs.network",
  web3_admin_approval_required: true,  //Require admin approval for wallet disconnection
  web3_auto_connect_verified_users: false,  //Auto-connect verified users to their wallets
};
