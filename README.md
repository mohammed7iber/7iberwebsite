# Print Shop Management System

A comprehensive internal management system for print shops to track clients, orders, quotes, and invoices.

## Features

- **Dashboard:** Overview of business metrics and recent activities
- **Client Management:** Store and manage customer information
- **Order Management:** Track print jobs with detailed specifications
- **Quote Generation:** Create professional quotes from orders
- **Invoice System:** Generate and manage invoices with payment tracking
- **Business Settings:** Configure shop details and services

## Setup Instructions

1. Clone the repository:
   ```
   git clone https://dev.azure.com/mohammedhudhud/print-shop-management/_git/print-shop-management
   ```

2. No server setup required - this is a client-side application that stores data in your browser's local storage.

3. Open `index.html` in your web browser to start using the application.

## Project Structure

```
/
├── index.html         (Main application page)
├── css/
│   └── styles.css     (Application styling)
├── js/
│   ├── app.js         (Main application logic)
│   ├── clients.js     (Client management functions)
│   ├── orders.js      (Order management functions)
│   ├── quotes.js      (Quote management functions)
│   └── invoices.js    (Invoice management functions)
└── README.md          (Documentation)
```

## Usage Guide

1. **Dashboard:** The home screen shows key metrics and recent activity
2. **Clients:** Add and manage your customer database
3. **Orders:** Create new print orders with detailed specifications
4. **Quotes:** Generate professional quotes based on orders
5. **Invoices:** Create invoices from quotes or directly, track payments
6. **Settings:** Configure your business information and services

## Data Storage

This application uses browser Local Storage to store all data. This means:
- Data persists between sessions on the same device and browser
- Data is not synchronized between devices
- Clearing browser data will erase application data

## Future Enhancements

- Server-side storage with database integration
- User authentication and permission system
- Integration with the Jordanian E-invoicing system for UBL 2.0 invoices
- Advanced reporting and analytics
- Print job scheduling and production tracking
- Inventory management for materials

## License

This project is proprietary software developed for internal use.

## Contact

For support or inquiries, please contact the developer.