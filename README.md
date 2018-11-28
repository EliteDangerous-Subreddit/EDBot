# EDBot
This is /r/EliteDangerous' bot running under /u/EliteDangerousBot. The project is only meant for main Elite Dangerous subreddit, though it does partake in Elite-related sister subreddits.

If you at any point want to make this towards your own subreddit, do look over all the files as they may contain /r/EliteDangerous specific changes.

# Installation

1. Copy `credentials.example.json` to `credentials.json`
1. Create a Reddit script app and add it to `credentials.json`
1. Create a [Google Service Account](https://console.developers.google.com/iam-admin/serviceaccounts/create) on Google API console
1. Download the JSON and place it under `/sidebar/googleapi-key.json` 
1. Update `calendar-settings.ts` accordingly
1. Copy `config.example.json` to `config.json` and configure accordingly
