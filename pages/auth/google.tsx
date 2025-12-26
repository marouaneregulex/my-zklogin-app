import { withGoogleCallback } from "@shinami/nextjs-zklogin/client";

export default withGoogleCallback(({ status }) => {
  switch (status) {
    case "loggingIn":
      return <p>Chugging along...</p>;
    case "error":
      return (
        <div>
          <p>Something went wrong with Google authentication</p>
          <div style={{ marginTop: "1rem", padding: "1rem", backgroundColor: "#fee", border: "1px solid #fcc" }}>
            <p><strong>Please check:</strong></p>
            <ul>
              <li>That <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> is set in your <code>.env.local</code> file</li>
              <li>That the redirect URI <code>http://localhost:3000/auth/google</code> is authorized in Google Console</li>
              <li>That <code>IRON_SESSION_SECRET</code> is set in your <code>.env.local</code> file</li>
              <li>That <code>SHINAMI_SUPER_ACCESS_KEY</code> and <code>NEXT_PUBLIC_SHINAMI_NODE_ACCESS_KEY</code> are set</li>
              <li>Check the browser console and server logs for more details</li>
            </ul>
          </div>
        </div>
      );
    default:
      return <p>Google callback</p>;
  }
});
