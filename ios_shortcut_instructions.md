# iOS Shortcut for Firestore Integration

This guide will help you set up an iOS Shortcut that can write data to your Firestore database.

## Prerequisites

- iOS device with the Shortcuts app installed
- Firebase project with Firestore enabled
- Deployed Firebase Function (already done)

## Function URL

Your Firebase Function is deployed at:
```
https://us-central1-codetv-andrew-billy.cloudfunctions.net/writeStateToFirestoreHttp
```

## Creating the iOS Shortcut

1. **Open the Shortcuts app** on your iOS device.

2. **Create a new shortcut**:
   - Tap on the "+" button in the top right corner.
   - Give your shortcut a name, such as "Write to Firestore".

3. **Add actions to the shortcut**:

   a. **Add a "Text" action** to create the JSON payload:
      - This will be the data you want to send to Firestore.
      - Example JSON:
      ```json
      {
        "collectionName": "events",
        "state": {
          "eventName": "Button Pressed",
          "timestamp": "Current Date" 
        }
      }
      ```
      - Note: You'll replace "Current Date" with an actual date variable in the next steps.

   b. **Add a "Get Current Date" action** if you want to include the timestamp.

   c. **Add a "Replace Text" action**:
      - Find: "Current Date"
      - Replace with: [Select the "Current Date" variable from the previous step]

   d. **Add a "URL" action**:
      - Enter the URL of your Firebase function:
      ```
      https://us-central1-codetv-andrew-billy.cloudfunctions.net/writeStateToFirestoreHttp
      ```

   e. **Add a "Get Contents of URL" action**:
      - Method: POST
      - Request Body: JSON
      - Request Body Contents: [Select the text variable from your first step]
      - Headers: Add a new header:
        - Key: Content-Type
        - Value: application/json

   f. **Optional**: Add a "Show Result" action to see the response from Firebase.

4. **Save your shortcut** by clicking "Done".

## Example Shortcut Structure

Here's what the shortcut should look like in sequence:

1. Text
   ```json
   {
     "collectionName": "events",
     "state": {
       "eventName": "Button Pressed",
       "timestamp": "Current Date"
     }
   }
   ```

2. Get Current Date

3. Replace Text
   - Find: "Current Date"
   - Replace with: [Current Date variable]

4. URL
   - URL: https://us-central1-codetv-andrew-billy.cloudfunctions.net/writeStateToFirestoreHttp

5. Get Contents of URL
   - Method: POST
   - Headers: Content-Type: application/json
   - Request Body: JSON
   - Request Body Contents: [Text variable]

6. Show Result

## Customizing the Data

You can customize the "state" object in the JSON to include any data you want to store in Firestore:

- Fixed values, such as event names or user actions
- Dynamic values from other shortcut actions (dates, locations, user input, etc.)
- Device information (if permitted)

## Advanced: Adding a Document ID

If you want to update a specific document rather than create a new one each time, include a "documentId" field in your JSON:

```json
{
  "collectionName": "events",
  "documentId": "user123-latest-status",
  "state": {
    "eventName": "Button Pressed",
    "timestamp": "Current Date"
  }
}
```

## Testing the Shortcut

1. Run the shortcut by tapping on it in the Shortcuts app.
2. You should see a success response if everything is working correctly.
3. Check your Firestore database to confirm the data was written.

## Troubleshooting

If you encounter errors:

1. Check that your JSON is properly formatted.
2. Ensure your Firebase function is deployed and accessible.
3. Check that your device has internet connectivity.
4. Look at the response from the "Show Result" action for error details.
