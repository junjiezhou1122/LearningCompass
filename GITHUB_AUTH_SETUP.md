# GitHub Authentication Setup for Learning Compass

Follow these steps to complete the GitHub authentication setup for your application:

## 1. Create GitHub OAuth Application

1. Go to your GitHub account
2. Navigate to **Settings** > **Developer settings** > **OAuth Apps**
3. Click on **New OAuth App**
4. Fill in the following details:
   - **Application name**: Learning Compass
   - **Homepage URL**: Your app's URL (e.g., `http://localhost:3000` for development)
   - **Application description**: (Optional) A brief description of your app
   - **Authorization callback URL**: Copy the callback URL from your Firebase console (see step 2 below)
5. Click **Register application**
6. After registration, you'll see your **Client ID**
7. Click **Generate a new client secret** to create your **Client Secret**
8. Copy both the **Client ID** and **Client Secret** as you'll need them in the next step

## 2. Configure GitHub Authentication in Firebase

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Authentication** > **Sign-in method**
4. Find **GitHub** in the list of providers and click on it
5. Toggle the **Enable** switch to enable GitHub authentication
6. Enter your **Client ID** and **Client Secret** from GitHub
7. Copy the **Authorization callback URL** from Firebase (you'll need to add this to your GitHub OAuth App settings)
8. Click **Save**
9. Go back to your GitHub OAuth App settings and update the Authorization callback URL with the value from Firebase

## 3. Add GitHub Authentication Environment Variables (Optional)

If you want to customize the GitHub authentication scopes or settings, you can add the following environment variables to your `.env` file:

```
# GitHub Auth (Optional)
VITE_GITHUB_SCOPES=user:email,read:user
```

## 4. Test GitHub Authentication

1. Start your application
2. Go to the login page
3. Click on the "GitHub" login button
4. You should be redirected to GitHub to authorize your application
5. After authorization, you should be redirected back to your application and logged in

## Troubleshooting

If you encounter any issues:

1. **"The redirect URI provided is not registered for this client ID"**:
   - Ensure the Authorization callback URL in GitHub exactly matches the one from Firebase

2. **"Authorization Error"**:
   - Check that your Client ID and Client Secret are correctly entered in Firebase
   - Verify that GitHub authentication is enabled in Firebase

3. **No Email from GitHub**:
   - Ensure your GitHub account has a verified email address
   - Check that you've requested the correct scopes (`user:email`)

4. **Failed to Sign In with GitHub**:
   - Check your browser console for error messages
   - Verify network requests to identify specific error responses
   - Ensure Firebase configuration is correct in your client application
   
If the problem persists, review the authentication logs in both Firebase and your server's console. 