//Set up a collection to contain reports
Reports = new Mongo.Collection("reports");

if (Meteor.isClient) {
  function getTime() {
    return new Date();
  }

  function cleanupReport(report) {
    if(!report || !report.date) {
      return;
    }

    var now = Session.get('time');
    //report.days = daysBetween(report.date, now);

    // Copy date parts of the timestamps, discarding the time parts.
    //var one = new Date(report.date.getFullYear(), report.date.getMonth(), report.date.getDate());
    //var two = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    var delta = Math.abs(now - report.date) / 1000;

    // calculate (and subtract) whole days
    var days = Math.floor(delta / 86400);
    delta -= days * 86400;

    // calculate (and subtract) whole hours
    var hours = Math.floor(delta / 3600) % 24;
    delta -= hours * 3600;

    // calculate (and subtract) whole minutes
    var minutes = Math.floor(delta / 60) % 60;
    delta -= minutes * 60;

    var seconds = Math.floor(delta % 60);  // in theory the modulus is not required

    report.seconds = seconds;
    report.minutes = minutes;
    report.hours = hours;
    report.days = days;
  }
  Template.lastReport.helpers({
    lastReportObj:function() {
      var report = Reports.findOne({}, {sort: {date: -1, description: 1}});
      //_.each(report, function (report) {
        cleanupReport(report);
      //});

      return report;
    }
  });

  Template.lastReport.time = function() {
    return Session.get('time');
  };

  Template.registerHelper('formatDate', function(date) {
    //weekday: "long",
    var options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    };
    return date.toLocaleTimeString("en-us", options);
  });

  Template.fileReport.events({
    'submit form': function(){
      // code goes here
      event.preventDefault();
      var description = event.target.newDescription.value;

      Meteor.call('logNewEvent', description, function(err, data) {
        if (err) {
          console.log(err);
        }
        console.log(data);
      });
    }
  });

  Template.reportList.helpers({
    reports: function () {
      var reports =  Reports.find({}, { sort: { date: -1, description: 1 } }).fetch();

      //Clean up data on each report for display
      _.each(reports, function (report) {
        cleanupReport(report);
      });

      return reports;
    }
  });

  Meteor.subscribe("reports");

  Meteor.setInterval(function() {
    Session.set('time', getTime());
  }, 200);
}

if (Meteor.isServer) {
  Meteor.methods({

    logNewEvent: function(description) {

      if(!description || description.length < 1) {
        throw new Meteor.Error( 500, 'There was an error processing your request' );
      }

      if(typeof description !== 'string') {
        throw new Meteor.Error( 500, 'ilegal param.' );
      }

      //Banned Words Go Here
      var bannedWords = [
          'Bacon',
      ];
      var bannedWordFound = false;

      _.each(bannedWords, function (word) {
        if(description.toLowerCase().indexOf(word.toLowerCase()) > -1) {
          bannedWordFound = true;
          return;
        }
      });
      //throw new Meteor.Error( 500, 'There was an error processing your request' );

      if(bannedWordFound) {
        throw new Meteor.Error(1337, 'Objection!!!');
      }

      Reports.insert({
        date: new Date(),
        description: description
      });


    }

  });


  Meteor.startup(function () {
    // code to run on server at startup

    if (Reports.find().count() === 0) {
      //If reports have not been initialized–Do that now

      //1,000 AD – Initial Date
      var initialDate = new Date(1000,00,01,12,21,00,0);
      var initialDescription = "This Database did not exist in 1,000 AD.";
      Reports.insert({
        date: initialDate,
        description: initialDescription
      });
    }

  });
}
