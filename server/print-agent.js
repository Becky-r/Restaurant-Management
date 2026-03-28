/**
 * Restaurant Management - Local Print Agent
 * 
 * Hardware Requirements: 
 * - Network Thermal Printers (80mm) with static IPs.
 * - Local Machine running Node.js.
 * 
 * Instructions:
 * 1. Install dependencies: npm install socket.io-client node-thermal-printer
 * 2. Set static IPs for your printers (e.g., 192.168.1.100, 192.168.1.101).
 * 3. Update the CONFIG below with your server URL and printer IPs.
 * 4. Run with: node print-agent.js
 */

const { io } = require("socket.io-client");
const { ThermalPrinter, PrinterTypes, CharacterSet } = require("node-thermal-printer");

// CONFIGURATION
const CONFIG = {
  SERVER_URL: "http://your-server-url.com", // Change to your cloud server URL
  PRINTER_KITCHEN_IP: "192.168.1.100",     // Static IP for Kitchen Printer
  PRINTER_JUICE_IP: "192.168.1.101",       // Static IP for Juice Section Printer
  PRINTER_TIMEOUT: 5000
};

const socket = io(CONFIG.SERVER_URL);

console.log("--- Restaurant Print Agent Started ---");
console.log(`Connecting to: ${CONFIG.SERVER_URL}`);

socket.on("connect", () => {
  console.log("Connected to server. Waiting for orders...");
});

socket.on("PRINT_ORDER", async (data) => {
  console.log(`\nNew Order Received: ${data.orderNumber}`);

  if (data.payloadA && data.payloadA.length > 0) {
    console.log("Printing Kitchen Ticket...");
    await printTicket(data, data.payloadA, CONFIG.PRINTER_KITCHEN_IP, "MAIN KITCHEN");
  }

  if (data.payloadB && data.payloadB.length > 0) {
    console.log("Printing Juice Ticket...");
    await printTicket(data, data.payloadB, CONFIG.PRINTER_JUICE_IP, "JUICE SECTION");
  }
});

async function printTicket(orderData, items, printerIp, stationName) {
  const printer = new ThermalPrinter({
    type: PrinterTypes.EPSON,
    interface: `tcp://${printerIp}`,
    characterSet: CharacterSet.PC852_LATIN2,
    removeSpecialCharacters: false,
    lineCharacter: "=",
    timeout: CONFIG.PRINTER_TIMEOUT
  });

  try {
    const isConnected = await printer.isPrinterConnected();
    if (!isConnected) {
        console.error(`Error: Could not connect to printer at ${printerIp}`);
        return;
    }

    printer.alignCenter();
    printer.setTextDoubleHeight();
    printer.setTextDoubleWidth();
    printer.println(`${orderData.orderNumber}`);
    printer.setTextNormal();
    printer.println(`Station: ${stationName}`);
    printer.println(`Table: ${orderData.tableId || "N/A"}`);
    printer.println(`Waiter: ${orderData.waiterName || "N/A"}`);
    printer.println(`Time: ${new Date().toLocaleTimeString()}`);
    printer.drawLine();

    printer.alignLeft();
    items.forEach(item => {
      printer.bold(true);
      printer.println(`${item.quantity} x ${item.name}`);
      printer.bold(false);
      if (item.notes) {
        printer.println(`   * NOTE: ${item.notes}`);
      }
    });

    printer.drawLine();
    printer.alignCenter();
    printer.println("Restaurant Management System");
    printer.cut();

    await printer.execute();
    console.log(`Successfully printed to ${stationName} at ${printerIp}`);
  } catch (error) {
    console.error(`Print failure at ${stationName}:`, error.message);
  }
}

socket.on("disconnect", () => {
  console.log("Disconnected from server.");
});
