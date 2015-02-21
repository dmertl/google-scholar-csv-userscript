// ==UserScript==
// @name         Google Scholar CSV Download
// @namespace    http://dmertl.com/userscripts/google-scholar
// @version      0.6
// @description  Allows downloading Google Scholar results in CSV format
// @author       David Mertl <dmertl@gmail.com>
// @match        https://scholar.google.com/scholar*
// @grant        none
// ==/UserScript==

function scrapeArticleCsv() {
  var articleData = getArticleData();
  return articleDataToCsv(articleData);
}

function getArticleData() {
  var articles = document.getElementsByClassName('gs_r');
  var results = [];
  for(var i = 0; i < articles.length; i++) {
    var data = {
      "title": null,
      "authors": null,
      "publication": null,
      "year": null,
      "url": null,
      "website": null,
      "abstract": null,
      "pdf_url": null,
    };
    //PDF URL
    var md_wp = articles[i].getElementsByClassName('gs_ggs');
    if(md_wp.length) {
      var a = md_wp[0].getElementsByTagName('a');
      if(a.length) {
        data['pdf_url'] = a[0].href;
      }
    }
    //Title and URL
    var gs_rt = articles[i].getElementsByClassName('gs_rt');
    if(gs_rt.length) {
      var a = gs_rt[0].getElementsByTagName('a');
      if(a.length) {
        data['url'] = a[0].href;
        data['title'] = a[0].textContent;
      }
    }
    //Authors, publication, website
    var gs_a = articles[i].getElementsByClassName('gs_a');
    if(gs_a.length) {
      var gs_a_text = gs_a[0].textContent;
      var gs_a_re = /(.+) - (.+) - (.+)/;
      var gs_a_parsed = gs_a_re.exec(gs_a_text);
      if(gs_a_parsed.length == 4) {
        data['authors'] = gs_a_parsed[1];
        data['website'] = gs_a_parsed[3];
        var publication = gs_a_parsed[2];
        var year_re = /\b(?:20|19)\d{2}\b/;
        var pub_parse = year_re.exec(gs_a_parsed[2]);
        if(pub_parse) {
          data['year'] = pub_parse[0];
          data['publication'] = publication.replace(data['year'], '').replace(', ', '');
        }
      } else {
        data['authors'] = gs_a_text;
      }
    }
    //Abstract
    var gs_rs = articles[i].getElementsByClassName('gs_rs');
    if(gs_rs.length) {
      data['abstract'] = gs_rs[0].textContent;
    }
    results.push(data);
  }
  return results;
}

function articleDataToCsv(articleData) {
  var csv = 'Title, Authors, Publication, Year, URL, Website, Abstract, PDF URL' + "\n";
  for(var i = 0; i < articleData.length; i++) {
    for(var col in articleData[i]) {
      if(articleData[i].hasOwnProperty(col)) {
        if(articleData[i][col]) {
          csv += '"' + articleData[i][col].replace(/"/g, '""') + '",';
        } else {
          csv += '" ",';
        }
      }
    }
    csv += "\n";
  }
  return csv;
}

function utf8_to_b64(str) {
    return window.btoa(unescape(encodeURIComponent(str)));
}

function insertUi() {
    var gs_lnv = document.getElementById('gs_lnv');
    if(gs_lnv) {
        //Scrape article page into CSV
        var csv = scrapeArticleCsv();
        var csv_uri =  'data:text/csv;base64,' + utf8_to_b64(csv.replace(/[^\x00-\x7F]/g, ''));
        
        var gs_pad = document.createElement('div');
        gs_pad.className = 'gs_pad';
        var cont = document.createElement('div');
        var link = document.createElement('a');
        link.className = 'gs_btnM gs_in_ib';
        link.href = csv_uri;
        link.download = getFilename();
        var gs_lbl = document.createElement('span');
        gs_lbl.className = 'gs_lbl';
        gs_lbl.textContent = 'Download CSV';
        var gs_ico = document.createElement('span');
        gs_ico.className = 'gs_ico';
        gs_ico.style.background = 'url(https://cdnjs.cloudflare.com/ajax/libs/foundicons/3.0.0/svgs/fi-download.svg) 0 -3px no-repeat';
        gs_ico.style.backgroundSize = '20px 20px';
        link.appendChild(gs_lbl);
        link.appendChild(gs_ico);
        cont.appendChild(link);
        gs_pad.appendChild(cont);
        gs_lnv.appendChild(gs_pad);
    } else {
        console.error('Unable to find #gs_lnv to insert UI');
    }
}

function getFilename() {
    return document.getElementsByTagName('title')[0].textContent.replace(' - Google Scholar', '') + '.csv';
}

insertUi();
