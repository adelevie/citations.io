// gets the li tags that are citation list items
// converts node list to array, returns the arry
// TODO: use jquery
var getCitationListItems = function() {
  var citationListItems = document.querySelectorAll('.citationListItem');
  var citationListItemsArray = Array.prototype.slice.call(citationListItems);
  return citationListItemsArray;
};

// gets the ul tag that is the parent of the citation list items
var getCitationsList = function() {
  return $('#citationsList');
};

var appendNewCitations = function(text) {
  getCitationsFromText(text, handleCitationResponse);
};

// sends http request to citation server
// hands off response data to handler function
var getCitationsFromText = function(text, success) {
  var root = 'http://citations.io'
  if (document.location.hostname == 'localhost') { root = 'http://localhost:3000'; }
  var url = root + '/citation/find';
  $.ajax({
    url: url,
    type: 'POST',
    crossDomain: true,
    data: {text: text},
    success: success
  });
};

var arrayOfUrlATagsFromCitation = function(citation) {
  return _.map(citation.urls, function(url) {
    return _.template("<a href='<%= url %>'><%= inner %></a>")({url: url.url, inner: url.source});
  });
};

// response handler function adds citations to the DOM
var handleCitationResponse = function(citations) {
  var citations = _.filter(citations, function(citation) {
    return citation.type == 'case';
  });
  citations.forEach(function(citation) {
    var compiled = _.template("<li><%= name %> (<%= urls.join(' | ') %>)</li>");
    var li = compiled({name: citation.match, urls: arrayOfUrlATagsFromCitation(citation)});
    console.log(compiled);
    getCitationsList().append(li);
  });
};

// gets the button element below the textarea
var getButton = function() {
  //return document.getElementById('textareaButton');
  return $('#textareaButton');
};

// initializes the inkfilepicker.com API
var initializeFilepicker = function() {
  filepicker.setKey("AXueM1djeR2fbXF0lgqQxz");
};

var getTextFromDocumentUrl = function(url, success) {
  $.ajax({
    url: url,
    type: 'GET',
    crossDomain: true,
    success: success
  });
};

var bindButtonToClick = function(handler) {
  getButton().bind('click', handler);
};

// remove all current citations from the list
var removeOldCitations = function() {
  getCitationListItems().forEach(function(citationListItem) {
    getCitationsList().removeChild(citationListItem);
  });
};

var documentUploaded = function(handler) {
  filepicker.pick(handler);
};

var initializeLoadingDialogue = function() {
  $(document).ajaxStop(function() {
    $('#loading').hide();
  });
  $('#loading').hide();
};

var showLoadingDialogue = function() {
  $('#loading').show();
};

// waits until the DOM is loaded
//  document.addEventListener('DOMContentLoaded', function() {
$(document).ready(function() {
  initializeLoadingDialogue();
  initializeFilepicker();
  bindButtonToClick(function() {
    documentUploaded(function(blob) {
      showLoadingDialogue();
      getTextFromDocumentUrl(blob.url, function(text) {
        removeOldCitations();
        appendNewCitations(text);
      });      
    });   
  });
});