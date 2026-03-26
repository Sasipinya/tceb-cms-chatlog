import NextAuth, { type NextAuthOptions } from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { connectMongo } from '@/lib/mongo';
import { CmsUser, AuditLog } from '@/lib/models';

const ALLOWED_DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN ?? 'terodigital.com';

export const authOptions: NextAuthOptions = {
  providers: [
    AzureADProvider({
      clientId:     process.env.AZURE_AD_CLIENT_ID     ?? '',
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET ?? '',
      tenantId:     process.env.AZURE_AD_TENANT_ID     ?? 'common',
      authorization: { params: { scope: 'openid profile email User.Read' } },
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        // Hardcoded admin
        if (
          credentials.email    === process.env.ADMIN_EMAIL &&
          credentials.password === process.env.ADMIN_PASSWORD
        ) {
          return { id: 'superadmin', name: 'Super Admin', email: credentials.email, role: 'admin', approved: true };
        }

        // Local user
        await connectMongo();
        const user = await CmsUser.findOne({ email: credentials.email, provider: 'local' }).select('+password').lean() as any;
        if (!user?.password) return null;
        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;
        await CmsUser.updateOne({ _id: user._id }, { $set: { last_login: new Date() } });
        return { id: String(user._id), name: user.name, email: user.email, role: user.role, approved: user.approved };
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'credentials') return true;

      const email  = user.email ?? '';
      const domain = email.split('@')[1] ?? '';
      if (domain !== ALLOWED_DOMAIN) return false;

      await connectMongo();
      await CmsUser.findOneAndUpdate(
        { email },
        {
          $setOnInsert: { email, role: 'pending', approved: false, provider: 'microsoft' },
          $set: { last_login: new Date(), name: user.name ?? email, image: user.image ?? '' },
        },
        { upsert: true, new: true }
      );
      return true;
    },

    async jwt({ token, account, user }) {
      if (account?.provider === 'credentials') {
        token.role     = (user as any).role     ?? 'admin';
        token.approved = (user as any).approved ?? true;

        // Log login
        await connectMongo();
        await AuditLog.create({
          user_email: token.email,
          user_name:  token.name,
          action:     'login',
          target_type:'system',
          detail:     'Login via credentials',
        }).catch(() => {});
        return token;
      }

      if (account?.provider === 'azure-ad') {
        await connectMongo();
        const dbUser = await CmsUser.findOne({ email: token.email }).lean() as any;
        token.role     = dbUser?.role     ?? 'pending';
        token.approved = dbUser?.approved ?? false;
        token.userId   = String(dbUser?._id ?? '');

        // Log login
        await AuditLog.create({
          user_email: token.email,
          user_name:  token.name,
          action:     'login',
          target_type:'system',
          detail:     'Login via Microsoft',
        }).catch(() => {});
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role     = token.role;
        (session.user as any).approved = token.approved;
        (session.user as any).userId   = token.userId;
      }
      return session;
    },
  },

  pages:   { signIn: '/login', error: '/login' },
  session: { strategy: 'jwt' },
  secret:  process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };