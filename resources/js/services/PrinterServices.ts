/* eslint-disable @typescript-eslint/no-explicit-any */

class PrinterService {
  private static instance: PrinterService;
  private printerEndpoint: string;
  private connected: boolean = false;
  private printerType: 'usb' | 'bluetooth' | 'network' | 'serial' | 'api' | null = null;
  private activeDevice: any = null;

  // Private constructor for singleton pattern
  private constructor() {
    this.printerEndpoint = 'http://localhost:8000/';
  }

  // Get singleton instance
  public static getInstance(): PrinterService {
    if (!PrinterService.instance) {
      PrinterService.instance = new PrinterService();
    }
    return PrinterService.instance;
  }

  // Set custom endpoint for server-side printing
  public setPrinterEndpoint(endpoint: string): void {
    this.printerEndpoint = endpoint;
  }

  // Check if a printer is connected
  public isConnected(): boolean {
    return this.connected;
  }

  // Get current printer type
  public getPrinterType(): string | null {
    return this.printerType;
  }

  // Discover and connect to a USB printer
  public async connectUsbPrinter(): Promise<boolean> {
    if (!('usb' in navigator)) {
      console.error('WebUSB API not supported in this browser');
      return false;
    }

    try {
      // Request access to USB device - will prompt user to select device
      const device = await navigator.usb.requestDevice({
        filters: [
          { vendorId: 0x0FE6, productId: 0x811E }
        ]
      });



      await device.open();

      // Most printers use configuration 1
      if (device.configuration === null) {
        await device.selectConfiguration(1);
      }

      // Try to claim the first interface
      await device.claimInterface(0);

      this.connected = true;
      this.printerType = 'usb';
      this.activeDevice = device;

      console.log(`USB printer connected: ${device.productName}`);
      return true;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'NotFoundError') {
        console.log('User cancelled printer selection');
        return false; // Return without marking as error
      }

      console.error('Error connecting to USB printer:', error);
      this.connected = false;
      this.activeDevice = null;
      return false;
    }
  }

  // Connect to a Bluetooth printer
  // public async connectBluetoothPrinter(): Promise<boolean> {
  //   if (!navigator.bluetooth) {
  //     console.error('Web Bluetooth API not supported in this browser');
  //     return false;
  //   }

  //   try {
  //     // Request device - will prompt user to select device
  //     const device = await navigator.bluetooth.requestDevice({
  //       filters: [
  //         // Common names for thermal printers
  //         { namePrefix: 'Printer' },
  //         { namePrefix: 'POS' },
  //         { namePrefix: 'ESCPOS' },
  //         { namePrefix: 'Thermal' },
  //         // Some printers advertise these services
  //         { services: ['000018f0-0000-1000-8000-00805f9b34fb'] }, // Printer service
  //         { services: ['1812'] }, // Human Interface Device
  //         { services: ['1801'] }, // Generic Attribute
  //         { services: ['180A'] }  // Device Information
  //       ],
  //       optionalServices: [
  //         '000018f0-0000-1000-8000-00805f9b34fb', 
  //         '1812', 
  //         '1801', 
  //         '180A', 
  //         'battery_service'
  //       ]
  //     });

  //     const server = await device.gatt?.connect();
  //     if (!server) {
  //       throw new Error('Failed to connect to GATT server');
  //     }

  //     this.connected = true;
  //     this.printerType = 'bluetooth';
  //     this.activeDevice = device;

  //     console.log(`Bluetooth printer connected: ${device.name}`);
  //     return true;
  //   } catch (error) {
  //     console.error('Error connecting to Bluetooth printer:', error);
  //     this.connected = false;
  //     this.activeDevice = null;
  //     return false;
  //   }
  // }

  // Connect to a network printer
  public async connectNetworkPrinter(ipAddress: string, port: number = 9100): Promise<boolean> {
    try {
      const response = await fetch(`${this.printerEndpoint}/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'network',
          ipAddress,
          port
        })
      });

      const result = await response.json();

      if (result.success) {
        this.connected = true;
        this.printerType = 'network';
        this.activeDevice = { ipAddress, port };
        console.log(`Network printer connected: ${ipAddress}:${port}`);
        return true;
      } else {
        throw new Error(result.message || 'Failed to connect to network printer');
      }
    } catch (error) {
      console.error('Error connecting to network printer:', error);
      this.connected = false;
      this.activeDevice = null;
      return false;
    }
  }

  // Connect to a serial printer
  public async connectSerialPrinter(): Promise<boolean> {

    if (!navigator.serial) {
      console.error('Web Serial API not supported in this browser');
      return false;
    }

    try {
      // Request port - will prompt user to select device
      const port = await (navigator as any).serial.requestPort();

      // Open the port with typical thermal printer settings
      await port.open({
        baudRate: 9600,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
        flowControl: 'none'
      });

      this.connected = true;
      this.printerType = 'serial';
      this.activeDevice = port;

      console.log('Serial printer connected');
      return true;
    } catch (error) {
      console.error('Error connecting to serial printer:', error);
      this.connected = false;
      this.activeDevice = null;
      return false;
    }
  }

  // Connect to a remote printing API
  public async connectApiPrinter(apiKey: string, endpoint?: string): Promise<boolean> {
    if (endpoint) {
      this.setPrinterEndpoint(endpoint);
    }

    try {
      const response = await fetch(`${this.printerEndpoint}/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          apiKey
        })
      });

      const result = await response.json();

      if (result.success) {
        this.connected = true;
        this.printerType = 'api';
        this.activeDevice = { apiKey, endpoint: this.printerEndpoint };
        console.log('API printer service connected');
        return true;
      } else {
        throw new Error(result.message || 'Failed to authenticate with printer API');
      }
    } catch (error) {
      console.error('Error connecting to printer API:', error);
      this.connected = false;
      this.activeDevice = null;
      return false;
    }
  }

  // Disconnect from the current printer
  public async disconnect(): Promise<boolean> {
    if (!this.connected) {
      return true; // Already disconnected
    }

    try {
      switch (this.printerType) {
        case 'usb':
          if (this.activeDevice) {
            await this.activeDevice.close();
          }
          break;

        case 'bluetooth':
          if (this.activeDevice?.gatt?.connected) {
            await this.activeDevice.gatt.disconnect();
          }
          break;

        case 'serial':
          if (this.activeDevice) {
            await this.activeDevice.close();
          }
          break;

        case 'network':
        case 'api':
          await fetch(`${this.printerEndpoint}/disconnect`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              type: this.printerType,
              device: this.activeDevice
            })
          });
          break;
      }

      this.connected = false;
      this.printerType = null;
      this.activeDevice = null;

      console.log('Printer disconnected');
      return true;
    } catch (error) {
      console.error('Error disconnecting from printer:', error);
      return false;
    }
  }

  // Print raw ESC/POS commands
  public async printRaw(commands: Uint8Array): Promise<boolean> {
    if (!this.connected) {
      console.error('No printer connected');
      return false;
    }

    try {
      switch (this.printerType) {
        case 'usb':
          // For USB printers, we need to find the right endpoint
          const endpointNumber = this.findOutEndpoint(this.activeDevice);
          if (endpointNumber) {
            await this.activeDevice.transferOut(endpointNumber, commands);
          } else {
            throw new Error('No suitable endpoint found for USB printer');
          }
          break;

        case 'bluetooth':
          // Printing via Bluetooth requires finding the right service and characteristic
          const service = await this.activeDevice.gatt.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
          const characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');

          // Some printers require breaking the data into chunks
          const CHUNK_SIZE = 512; // Adjust based on printer capabilities
          for (let i = 0; i < commands.length; i += CHUNK_SIZE) {
            const chunk = commands.slice(i, i + CHUNK_SIZE);
            await characteristic.writeValue(chunk);
          }
          break;

        case 'serial':
          {
            const writer = this.activeDevice.writable.getWriter();
            await writer.write(commands);
            writer.releaseLock();
            break;
          }

        case 'network':
        case 'api':
          // For network and API printers, send to server
          {
            const response = await fetch(`${this.printerEndpoint}/print`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/octet-stream'
              },
              body: commands
            });

            const result = await response.json();
            if (!result.success) {
              throw new Error(result.message || 'Print job failed on server');
            }
            break;
          }
      }

      console.log('Print job sent successfully');
      return true;
    } catch (error) {
      console.error('Error sending print job:', error);
      return false;
    }
  }

  // Print a text string (converts to ESC/POS commands)
  public async printText(text: string): Promise<boolean> {
    // Simple ESC/POS command sequence for text
    const encoder = new TextEncoder();
    const textBytes = encoder.encode(text);

    // Initialize printer, print text, cut paper
    const commands = new Uint8Array([
      0x1B, 0x40,                          // ESC @ - Initialize printer
      ...textBytes,                        // Text content
      0x0A, 0x0A, 0x0A, 0x0A,              // Line feeds
      0x1D, 0x56, 0x41, 0x03               // GS V A 3 - Cut paper (partial cut)
    ]);

    return await this.printRaw(commands);
  }

  // Print a receipt (more complex formatting)
  public async printReceipt(options: {
    header?: string;
    storeName?: string;
    items: Array<{ name: string; qty: number; price: number }>;
    subtotal: number;
    tax?: number;
    total: number;
    footer?: string;
    date?: Date;
  }): Promise<boolean> {
    const date = options.date || new Date();
    const dateString = date.toLocaleDateString();
    const timeString = date.toLocaleTimeString();

    let receipt = '';

    // Header
    if (options.header) {
      receipt += options.header + '\n\n';
    }

    // Store name
    if (options.storeName) {
      receipt += options.storeName + '\n';
    }

    receipt += `${dateString} ${timeString}\n`;
    receipt += '-'.repeat(32) + '\n\n';

    // Items
    options.items.forEach(item => {
      const itemTotal = (item.qty * item.price).toFixed(2);
      const itemLine = `${item.name.padEnd(20).substring(0, 20)}`;
      const qtyLine = `${item.qty}x $${item.price.toFixed(2)}`;
      const priceLine = `$${itemTotal.padStart(7)}`;

      receipt += `${itemLine}\n${qtyLine.padStart(16)}${priceLine.padStart(16)}\n`;
    });

    receipt += '\n' + '-'.repeat(32) + '\n';

    // Subtotal
    receipt += `Subtotal:${('$' + options.subtotal.toFixed(2)).padStart(24)}\n`;

    // Tax
    if (options.tax) {
      receipt += `Tax:${('$' + options.tax.toFixed(2)).padStart(28)}\n`;
    }

    // Total
    receipt += `TOTAL:${('$' + options.total.toFixed(2)).padStart(26)}\n\n`;

    // Footer
    if (options.footer) {
      receipt += options.footer + '\n';
    }

    // Add some space and cut instruction
    receipt += '\n\n\n\n';

    return await this.printText(receipt);
  }

  // Utility function to find a suitable output endpoint for USB printers
  private findOutEndpoint(device: any): number | null {
    // Get active configuration and interface
    const configuration = device.configuration;
    const interfaces = configuration?.interfaces;

    if (!interfaces) {
      return null;
    }

    // Look through interfaces and endpoints
    for (const iface of interfaces) {
      const endpoints = iface.alternate.endpoints;

      for (const endpoint of endpoints) {
        // We're looking for an OUT endpoint (direction: 'out')
        if (endpoint.direction === 'out') {
          return endpoint.endpointNumber;
        }
      }
    }

    return null;
  }

  // Print an image (basic implementation)
  public async printImage(imageData: Uint8Array, width: number, height: number): Promise<boolean> {
    if (!this.connected) {
      console.error('No printer connected');
      return false;
    }

    try {
      // This is a simplified approach. Real implementation would need to:
      // 1. Convert image to monochrome if it isn't already
      // 2. Format according to printer's specific image protocol
      // 3. Split into bands if needed

      // ESC/POS command for printing a raster image
      // This is a simplified generic approach and may need adjustments for specific printers
      const header = new Uint8Array([
        0x1B, 0x40,                                // ESC @ - Initialize printer
        0x1D, 0x76, 0x30, 0x00,                    // GS v 0 - Raster bit image
        width & 0xFF, (width >> 8) & 0xFF,         // width low & high bytes
        height & 0xFF, (height >> 8) & 0xFF        // height low & high bytes
      ]);

      const footer = new Uint8Array([
        0x0A, 0x0A, 0x0A, 0x0A,                    // Line feeds
        0x1D, 0x56, 0x41, 0x03                     // GS V A 3 - Cut paper (partial cut)
      ]);

      // Combine the commands
      const commands = new Uint8Array(header.length + imageData.length + footer.length);
      commands.set(header, 0);
      commands.set(imageData, header.length);
      commands.set(footer, header.length + imageData.length);

      return await this.printRaw(commands);
    } catch (error) {
      console.error('Error printing image:', error);
      return false;
    }
  }

  // Get printer status
  public async getPrinterStatus(): Promise<any> {
    if (!this.connected) {
      return { status: 'disconnected' };
    }

    try {
      switch (this.printerType) {
        case 'api':
        case 'network':
          const response = await fetch(`${this.printerEndpoint}/status`, {
            method: 'GET'
          });
          return await response.json();

        case 'usb':
        case 'bluetooth':
        case 'serial':
          // These would require sending status request commands and parsing responses
          // This is highly printer-specific, so we'll return a basic status
          return {
            status: 'connected',
            type: this.printerType,
            device: this.activeDevice ?
              (this.printerType === 'usb' ? this.activeDevice.productName :
                this.printerType === 'bluetooth' ? this.activeDevice.name :
                  'Serial port') : 'unknown'
          };

        default:
          return { status: 'unknown' };
      }
    } catch (error) {
      console.error('Error getting printer status:', error);
      return { status: 'error', message: error.message };
    }
  }
}

export default PrinterService;