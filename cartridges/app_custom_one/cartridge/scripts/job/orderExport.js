//our scope is 'orderExportCSV' function


'use strict';

var Site = require('dw/system/Site');
var Calendar = require('dw/util/Calendar');
var OrderMgr = require('dw/order/OrderMgr');
var File = require('dw/io/File');
var FileWriter = require('dw/io/FileWriter');
var CSVStreamWriter = require('dw/io/CSVStreamWriter');
var PaymentInstrument = require('dw/order/PaymentInstrument');
var StringUtils = require('dw/util/StringUtils');
var PaymentMgr = require('dw/order/PaymentMgr');
var Logger = require('dw/system/Logger').getLogger('orderexport', 'orderexport');
var maxProductLines = 5;

function orderExportCSV(args) {
    try {
        var siteId = Site.getCurrent().ID;
        var calendarFormat = StringUtils.formatCalendar(Site.calendar, 'yyyy_MM_dd_HH_mm');
        var fileName = siteId + '_orderExport_' + calendarFormat + '.csv';
        
        var customSubFolderPath = 'order/export';
        var filePath = [File.IMPEX, 'src', customSubFolderPath].join(File.SEPARATOR);
        if (filePath.charAt(filePath.length - 1) !== '/') {
            filePath = filePath.concat('/');
        }
        var dirPath = new File(filePath);
        if (!dirPath.exists()) {
            dirPath.mkdirs();
        }
            var csvfile = new File(filePath + fileName);
            if (!csvfile.exists()) {
                csvfile.createNewFile();
            }
            var fileWriter = new FileWriter(csvfile, "UTF-8", true);
            fileWriter.write("\ufeff");
            var csvStreamWriter = new CSVStreamWriter(fileWriter,',','|');
        var headerArray = new Array();
        headerArray.push('siteID');
        headerArray.push('orderNo');
        headerArray.push('email');
        headerArray.push('customerNo');
        headerArray.push('customerName');
        headerArray.push('orderDate');
        headerArray.push('status');
        headerArray.push('shippingMethod');
        headerArray.push('shippingAddress_fullName');
        headerArray.push('shippingAddress_address1');
        headerArray.push('shippingAddress_state');
        headerArray.push('shippingAddress_city');
        headerArray.push('shippingAddress_phone');
        headerArray.push('paymentMethod');
        headerArray.push('merchandizeTotalPrice');
        headerArray.push('merchandizeTotalAdjustPrice');
        headerArray.push('shippingTotalPrice');
        headerArray.push('shippingTotalAdjustPrice');
        headerArray.push('tax');
        headerArray.push('totalPrice');

        csvStreamWriter.writeNext(headerArray);

        var startDate = args.startDate;
        var endDate = args.endDate;
        var orders = OrderMgr.searchOrders("creationDate >= {0} AND creationDate <= {1}", "orderNo ASC", startDate, endDate);
        
        if(!empty(orders)){
            while (orders.hasNext()) {
                var order = orders.next();
                try {
                    csvStreamWriter.writeNext(generateOrderCSVLine(order));
                } catch(ex) {
                    var error = ex;
                    Logger.error('Error while csvStreamWriter in CSV Order export: {0}', ex.message);
                }
            }
        }

    } catch (e) {
        var error = e;
        Logger.error('Error in CSV Order export: {0}', e.message);
    } finally {
        csvStreamWriter.close();
    }
    return true;
}

function generateOrderCSVLine(order) {
    var shippingMethod  = '',
        fullName        = '',
        address1        = '',
        state           = '',
        city            = '',
        phone           = '',
        paymentMethod   = '';

    if (!empty(order.shipments)) {
        var shipment    = order.shipments[0];
        shippingMethod  = shipment.shippingMethod.displayName;
        fullName        = shipment.shippingAddress.fullName;
        address1        = shipment.shippingAddress.address1.replace(/,/g, '|    ');
        state           = shipment.shippingAddress.stateCode;
        city            = shipment.shippingAddress.city;
        phone           = shipment.shippingAddress.phone;
    }

    order.getPaymentInstruments().toArray().forEach(function (paymentInstrument) {
        if (!empty(paymentInstrument.paymentMethod) && !paymentInstrument.getPaymentMethod().equalsIgnoreCase(PaymentInstrument.METHOD_GIFT_CERTIFICATE)) {
            paymentMethod = PaymentMgr.getPaymentMethod(paymentInstrument.paymentMethod).name;      
        }
    });

    var orderLine = new Array();
    orderLine.push(Site.getCurrent().ID);
    orderLine.push(order.getOrderNo());
    orderLine.push(order.getCustomerEmail());
    orderLine.push(order.getCustomerNo());
    orderLine.push(order.getCustomerName());
    orderLine.push(order.getCreationDate());
    orderLine.push(order.getStatus().getDisplayValue());
    orderLine.push(shippingMethod);
    orderLine.push(fullName);
    orderLine.push(address1);
    orderLine.push(state);
    orderLine.push(city);
    orderLine.push(phone);
    orderLine.push(paymentMethod);
    orderLine.push(order.getAdjustedMerchandizeTotalGrossPrice().getValue());
    orderLine.push(order.getAdjustedMerchandizeTotalPrice().getValue());
    orderLine.push(order.getShippingTotalGrossPrice().getValue()); 
    orderLine.push(order.getAdjustedShippingTotalGrossPrice().getValue());
    orderLine.push(order.getTotalTax().getValue());
    orderLine.push(order.getTotalGrossPrice().getValue());
    orderLine = createProductsLine(order, orderLine);

    return orderLine;
}

function createProductsLine(order, orderLine) {
    order.getProductLineItems().toArray().forEach(function (pli) {
        orderLine.push(pli.getProductID());
        orderLine.push(pli.getProductName());
        orderLine.push(pli.getQuantityValue());
        orderLine.push(pli.getPrice());
        orderLine.push(pli.getAdjustedPrice());
    });

    return orderLine;
}

module.exports = {
    orderExportCSV: orderExportCSV
};
