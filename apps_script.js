// Google Apps Script for handling electronic order form submissions.
// Spreadsheet ID for order storage.
var SHEET_ID = '1He3MxPqQGcoOgUGEPoI1iVX6L5-U7j2TjQll2dWhr_w';

function doGet(e) {
  return HtmlService
    .createHtmlOutputFromFile('index')
    .setTitle('التحضير الإلكتروني')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// حفظ الطلب في Google Sheets مع حساب المجاميع التراكمية
function saveOrder(order) {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheets()[0];

    // إنشاء عناوين الأعمدة إذا كان الشيت فارغاً
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'رقم الطلب',
        'التاريخ والوقت',
        'الاسم',
        'الهاتف الأساسي',
        'هاتف بديل',
        'المحافظة',
        'اللواء',
        'العنوان التفصيلي',
        'الدفع عند الاستلام',
        'ملاحظات',
        'عدد المنتجات',
        'مجموع المنتجات (دنانير)',
        'رسوم التوصيل (دنانير)',
        'الإجمالي الكلي (دنانير)',
        'تفاصيل المنتجات',
        'المجموع التراكمي لقيم الطلبات (دنانير)',
        'المجموع التراكمي لرسوم التوصيل (دنانير)'
      ]);
    }

    var lastRow = sheet.getLastRow();
    var orderNumber = (lastRow - 1) + 1;

    var DELIVERY_FEE_COL = 13;
    var GRAND_TOTAL_COL = 14;

    var totalOrdersBefore = 0;
    var totalDeliveryBefore = 0;

    if (lastRow > 1) {
      var ordersRange = sheet.getRange(2, GRAND_TOTAL_COL, lastRow - 1, 1).getValues();
      for (var i = 0; i < ordersRange.length; i++) {
        var v = parseFloat(ordersRange[i][0]);
        if (!isNaN(v)) totalOrdersBefore += v;
      }

      var feesRange = sheet.getRange(2, DELIVERY_FEE_COL, lastRow - 1, 1).getValues();
      for (var j = 0; j < feesRange.length; j++) {
        var f = parseFloat(feesRange[j][0]);
        if (!isNaN(f)) totalDeliveryBefore += f;
      }
    }

    var currentGrandTotal = Number(order.grandTotal) || 0;
    var currentDeliveryFee = Number(order.deliveryFee) || 0;

    var cumulativeOrders = totalOrdersBefore + currentGrandTotal;
    var cumulativeDelivery = totalDeliveryBefore + currentDeliveryFee;

    var itemsText = '';
    if (order.items && order.items.length) {
      var lines = [];
      for (var k = 0; k < order.items.length; k++) {
        var it = order.items[k];
        lines.push(it.qty + ' × ' + it.name + ' (سعر: ' + it.price + ')');
      }
      itemsText = lines.join('\n');
    }

    sheet.appendRow([
      orderNumber,
      new Date(),
      order.name || '',
      order.phone || '',
      order.altPhone || '',
      order.governorate || '',
      order.district || '',
      order.address || '',
      order.cod ? 'نعم' : 'لا',
      order.notes || '',
      order.itemsCount || 0,
      order.productsTotal || 0,
      currentDeliveryFee || 0,
      currentGrandTotal || 0,
      itemsText,
      cumulativeOrders,
      cumulativeDelivery
    ]);

    return orderNumber;
  } catch (err) {
    Logger.log(err);
    throw err;
  }
}
