'use strict';

/**
 * @namespace Subscribe
 */

var server = require('server');

/**
 * ContactUs-Landing : This endpoint is called to load contact us landing page
 * @name Base/ContactUs-Landing
 * @function
 * @memberof ContactUs
 * @param {middleware} - server.middleware.https
 * @param {category} - sensitive
 * @param {renders} - isml
 * @param {serverfunction} - get
 */
server.get('Subscribe', server.middleware.https, function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');

    res.render('subscription/subscription.isml', {
        actionUrl: URLUtils.url('Subscription-Submit').toString()
    });

    next();
});

server.post('Submit', server.middleware.https, function (req, res, next) {
    var Resource = require('dw/web/Resource');
    var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
    var emailHelper = require('*/cartridge/scripts/helpers/emailHelpers');

    var myForm = req.form;
    var isValidEmailid = emailHelper.validateEmail(myForm.contactEmail);
    if (isValidEmailid) {
        var contactDetails = [myForm.contactFirstName, myForm.contactLastName, myForm.contactEmail, myForm.contactTopic, myForm.contactComment];
        hooksHelper('app.contactUs.subscribe', 'subscribe', contactDetails, function () {});

        res.json({
            success: true,
            msg: Resource.msg('subscribe.to.Subscribe', 'subscribe', null)
        });
    } else {
        res.json({
            error: true,
            msg: Resource.msg('subscribe.to.Subscribe.email.invalid', 'subscribe', null)
        });
    }

    next();
});

module.exports = server.exports();
