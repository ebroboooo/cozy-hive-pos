# **App Name**: Cozy-Hive POS

## Core Features:

- Dashboard Display: Show active customers, their entry time, elapsed time, and buttons for adding items and checkout.
- Real-time Customer Tracking: Automatically detect and log customer entry time, and track time spent in the co-working space using Firestore.
- Item Addition: Modal for adding items (coffee, tea, etc.) with quantity selection. Updates customer's tab in real-time using Firestore.
- Checkout System: Calculate total time, item costs, and total cost upon checkout. Move session data from active to completed sessions in Firestore.
- Daily Summary Page: Display completed sessions for the day with details and total income. Option to filter by date range.
- Items Management: Allow admin to add/edit/delete items and set prices.

## Style Guidelines:

- Primary color: Earthy green (#8FBC8F) to reflect the 'cozy jungle' theme and natural environment.
- Background color: Light beige (#F5F5DC) with subtle leafy or plant patterns for a warm, natural feel.
- Accent color: Warm brown (#A0522D) for interactive elements like buttons and highlights.
- Body and headline font: 'Poppins', sans-serif, for clear and modern readability. Note: currently only Google Fonts are supported.
- Use small bee and leaf icon accents in headers and buttons to enhance theme consistency.
- Utilize rounded cards, soft shadows, and animated transitions to create a smooth user experience.
- Incorporate subtle animations when updating data or transitioning between pages.