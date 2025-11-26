This is a [**React Native**](https://reactnative.dev) project using [**Expo**](https://expo.dev).

# Getting Started

> **Note**: Make sure you have completed the [Expo Environment Setup](https://docs.expo.dev/get-started/installation/) guide before proceeding.

## Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Expo CLI (installed globally or via npx)
- For iOS: Xcode (macOS only)
- For Android: Android Studio

## Step 1: Install Dependencies

First, install the project dependencies:

```sh
npm install
```

## Step 2: Start the Development Server

Start the Expo development server:

```sh
npx expo start
```

This will start Metro bundler and display a QR code. You can:

- **Scan the QR code** with Expo Go app on your phone (Android/iOS)
- **Press `a`** to open on Android emulator
- **Press `i`** to open on iOS simulator
- **Press `w`** to open in web browser

### Alternative Commands

```sh
# Start and open Android directly
npx expo start --android

# Start and open iOS directly
npx expo start --ios

# Start and open web directly
npx expo start --web
```

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.js` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

### Reloading the App

When you want to forcefully reload, for example to reset the state of your app:

- **In Expo Go**: Shake your device and select "Reload"
- **In Simulator/Emulator**: 
  - **Android**: Press <kbd>R</kbd> key twice or <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS)
  - **iOS**: Press <kbd>Cmd ⌘</kbd> + <kbd>R</kbd> in iOS Simulator
- **In Terminal**: Press <kbd>r</kbd> in the Expo CLI

## iOS Setup (macOS only)

For iOS development, you may need to install CocoaPods dependencies:

```sh
cd ios
bundle install
bundle exec pod install
cd ..
```

## Congratulations! :tada:

You've successfully run and modified your React Native App with Expo. :partying_face:

### Now what?

- Learn more about [Expo](https://docs.expo.dev/)
- Check out the [React Native documentation](https://reactnative.dev/docs/getting-started)
- Explore [Expo SDK APIs](https://docs.expo.dev/versions/latest/)

# Troubleshooting

If you're having issues:

- See the [Expo Troubleshooting guide](https://docs.expo.dev/troubleshooting/clear-cache/)
- Check the [React Native Troubleshooting page](https://reactnative.dev/docs/troubleshooting)
- Clear Expo cache: `npx expo start -c`

# Learn More

To learn more, take a look at the following resources:

- [Expo Documentation](https://docs.expo.dev/) - learn more about Expo.
- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Expo Blog](https://blog.expo.dev/) - read the latest Expo blog posts.
- [React Native Blog](https://reactnative.dev/blog) - read the latest React Native blog posts.
