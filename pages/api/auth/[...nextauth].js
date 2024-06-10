import NextAuth from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";

const options = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
      tenantId: process.env.AZURE_AD_TENANT_ID,
    }),
  ],
  debug: false,
};

const handler = (req, res) => NextAuth(req, res, options);

export default handler;
