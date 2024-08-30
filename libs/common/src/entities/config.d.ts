/* Autogenerated code */

export interface Config {
  apps: {
    api: {
      port: number;
      privatePort: number;
      useCachingInterceptor: boolean;
    };
    duneMock: {
      port: number;
      privatePort: number;
      useCachingInterceptor: boolean;
    };
  };
  libs: {
    common: {
      network: "devnet" | "testnet" | "mainnet";
      urls: {
        api: string;
        dataApiCex: string;
        dataApiXexchange: string;
        duneMockApi: string;
      };
      database: {
        host: string;
        port: number;
        username?: string;
        password?: string;
        name: string;
        tlsAllowInvalidCertificates: boolean;
      };
      redis: {
        host: string;
        port: number;
      };
      features: {
        dune: {
          enabled: boolean;
          namespace: string;
          apiKey: string;
        };
      };
      nativeAuth: {
        maxExpirySeconds: number;
        acceptedOrigins: string[];
      };
      security: {
        admins: string[];
      };
      rateLimiterSecret?: string;
    };
  };
}
