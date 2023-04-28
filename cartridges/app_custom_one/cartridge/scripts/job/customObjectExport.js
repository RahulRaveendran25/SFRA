//our scope is 'execute' function


'use strict';

var Site = require('dw/system/Site');
var Calendar = require('dw/util/Calendar');
var OrderMgr = require('dw/order/OrderMgr');
var File = require('dw/io/File');
var FileWriter = require('dw/io/FileWriter');
var CSVStreamWriter = require('dw/io/CSVStreamWriter');
var StringUtils = require('dw/util/StringUtils');
var Logger = require('dw/system/Logger').getLogger('orderexport', 'orderexport');
var maxProductLines = 5;
var CustomObjectMgr= require('dw/object/CustomObjectMgr');
const Status = require('dw/system/Status');

function execute (args) {
    try {
        var siteId = Site.getCurrent().ID;
        var calendarFormat = StringUtils.formatCalendar(Site.calendar, 'yyyy_MM_dd_HH_mm');
        var fileName = siteId + '_customObjectExport_' + calendarFormat + '.csv';
        var customSubFolderPath = 'object/details';
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
        headerArray.push('First Name');
        headerArray.push('Last Name');
        headerArray.push('Email');
        headerArray.push('Creation Date');


        csvStreamWriter.writeNext(headerArray);

        var CustomObjects = CustomObjectMgr.getAllCustomObjects(args.ObjectType);
        
        if(!empty(CustomObjects)){
            while (CustomObjects.hasNext()) {
                var subscription = CustomObjects.next();
                try {
                    csvStreamWriter.writeNext(generateOrderCSVLine(subscription));
                } catch(ex) {
                    var error = ex;
                    Logger.error('Error while csvStreamWriter in CSV Order export: {0}', ex.message);
                    throw ex;
                }
            }
        }

    } catch (e) {
        var error = e;
        Logger.error('Error in CSV Order export: {0}', e.message);
        return new Status(Status.ERROR, 'ERROR');
        csvStreamWriter.close();

    }
    //  finally {
    //     csvStreamWriter.close();
    //     Logger.info('[END] Order Audit Report');
    //     return new Status(Status.OK);
    // }
    csvStreamWriter.close();
    Logger.info('[END] Order Audit Report');
    return new Status(Status.OK)
    return true;
}

function generateOrderCSVLine(subscription) {
    var orderLine = new Array();
    orderLine.push(subscription.custom.firstName);
    orderLine.push(subscription.custom.lastName);
    orderLine.push(subscription.custom.emailID);
    let formattedDate = subscription.creationDate.toISOString().split('T')[0];
    orderLine.push(formattedDate);
    return orderLine;
}

module.exports = {
    execute: execute
};
