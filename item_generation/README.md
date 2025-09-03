# Halloween Item Generator

This project generates Halloween-themed items with:
- Descriptive names and categories
- Gemini Flash-generated images
- Estimated costs in USD
- Storage in Firestore database

## Requirements

- Python 3.8+
- Google Gemini API key (specifically for Gemini 2.5 Flash Image model)
- Firebase project with Firestore database (already configured for codetv-andrew-billy project)

## Setup

1. Install the required packages:
   ```bash
   pip install -r requirements.txt
   ```

2. Set up environment variables:
   - Create a `.env` file with your Gemini API key:
     ```
     GEMINI_API_KEY=your_gemini_api_key_here
     ```
   - Note: Firebase service account credentials are already hardcoded in the script

3. Run the script:
   ```bash
   python generate_halloween_items.py
   ```

   Note: If no Gemini API key is provided, the script will automatically fall back to generating custom placeholder images.

## How it Works

1. The script contains a hardcoded array of Halloween items (costumes, candy, masks, witchy items).
2. For each item, it:
   - Generates a descriptive prompt for image generation
   - Uses Gemini 2.5 Flash Image to create a Halloween-themed product image
   - Falls back to custom category-based placeholder images if API key is missing or errors occur
   - Uploads the generated image to Firebase Storage
   - Generates a random price within a reasonable range
   - Saves the item data with the Storage URL to Firestore in the 'items' collection
   - Keeps a local copy of images in the 'data' directory
   
### Image Generation with Background Removal and Resizing

The script uses a three-step process to create perfect Halloween product icons with transparent backgrounds:

1. **Gemini Image Generation**:
   - Sends a detailed prompt to the Gemini 2.5 Flash Image API requesting a well-lit image with a solid white background
   - Receives image data through a streaming response and saves it to the local filesystem

2. **Automatic Background Removal**:
   - Processes each generated image with the `rembg` library
   - Removes the background completely, creating a transparent PNG
   - This ensures the final images only show the product itself with no background elements

3. **Icon Resizing**:
   - Resizes each transparent image to exactly 100x100 pixels
   - Maintains aspect ratio and centers the item in the square frame
   - Creates perfect icon-sized images ideal for compact UI elements

This approach creates professional product icons that can be displayed seamlessly in any e-commerce interface, providing a consistent and clean visual experience.

If no Google API key is provided or if any errors occur during image generation, the script 
automatically falls back to creating custom placeholder images with themed designs based on
the item's category.

## Firebase Structure

### Firestore Database
Items are stored in the Firestore database with the following structure:

```
items (collection)
  └── [auto-generated-id] (document)
        ├── id: string
        ├── name: string
        ├── category: string
        ├── description: string
        ├── price: number
        ├── image_url: string (points to Firebase Storage URL)
        ├── image_local_path: string (local backup path)
        └── created_at: timestamp
```

### Firebase Storage
Images are stored directly in the top-level Firebase Storage bucket:

```
[image-name]_icon.png
```

The simplifies access and organization, making it easier to reference the images in your application.

## Customization

To add more items, edit the `HALLOWEEN_ITEMS` array in the script with additional items following the same structure.

## Notes

- Images are automatically uploaded to Firebase Storage and made publicly accessible
- The script includes a small delay between processing items to avoid hitting API rate limits
- If image generation fails, a placeholder URL is used
