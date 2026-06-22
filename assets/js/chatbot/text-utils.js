/*! EO Studio Chatbot — text utilities: normalize, tokenize, fuzzy match (no external deps) */
(function (global) {
  "use strict";

  var VN_MAP = {
    "à":"a","á":"a","ạ":"a","ả":"a","ã":"a","â":"a","ầ":"a","ấ":"a","ậ":"a","ẩ":"a","ẫ":"a",
    "ă":"a","ằ":"a","ắ":"a","ặ":"a","ẳ":"a","ẵ":"a",
    "è":"e","é":"e","ẹ":"e","ẻ":"e","ẽ":"e","ê":"e","ề":"e","ế":"e","ệ":"e","ể":"e","ễ":"e",
    "ì":"i","í":"i","ị":"i","ỉ":"i","ĩ":"i",
    "ò":"o","ó":"o","ọ":"o","ỏ":"o","õ":"o","ô":"o","ồ":"o","ố":"o","ộ":"o","ổ":"o","ỗ":"o",
    "ơ":"o","ờ":"o","ớ":"o","ợ":"o","ở":"o","ỡ":"o",
    "ù":"u","ú":"u","ụ":"u","ủ":"u","ũ":"u","ư":"u","ừ":"u","ứ":"u","ự":"u","ử":"u","ữ":"u",
    "ỳ":"y","ý":"y","ỵ":"y","ỷ":"y","ỹ":"y",
    "đ":"d"
  };

  function stripDiacritics(str) {
    if (!str) return "";
    var out = "";
    var lower = String(str).toLowerCase();
    for (var i = 0; i < lower.length; i++) {
      var ch = lower[i];
      out += VN_MAP[ch] !== undefined ? VN_MAP[ch] : ch;
    }
    return out;
  }

  // canonical form used as dictionary/index key: lowercase + no diacritics + single-spaced
  function normalize(str) {
    return stripDiacritics(str)
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  var STOPWORDS = new Set([
    "la","va","la gi","cua","o","tai","trong","den","cho","mot","nhung","co","khong",
    "the","is","a","an","of","the","in","at","to","for","and","or","what","where","how",
    "duoc","nao","day","kia","gi","ay","do","ban"
  ]);

  function tokenize(str) {
    var norm = normalize(str);
    if (!norm) return [];
    return norm.split(" ").filter(function (t) { return t.length > 0; });
  }

  function tokenizeMeaningful(str) {
    return tokenize(str).filter(function (t) { return !STOPWORDS.has(t) && t.length > 1; });
  }

  // classic Levenshtein edit distance, iterative DP, O(n*m)
  function levenshtein(a, b) {
    if (a === b) return 0;
    var al = a.length, bl = b.length;
    if (al === 0) return bl;
    if (bl === 0) return al;
    var prev = new Array(bl + 1);
    var curr = new Array(bl + 1);
    for (var j = 0; j <= bl; j++) prev[j] = j;
    for (var i = 1; i <= al; i++) {
      curr[0] = i;
      var ca = a.charCodeAt(i - 1);
      for (j = 1; j <= bl; j++) {
        var cost = ca === b.charCodeAt(j - 1) ? 0 : 1;
        curr[j] = Math.min(
          prev[j] + 1,
          curr[j - 1] + 1,
          prev[j - 1] + cost
        );
      }
      var tmp = prev; prev = curr; curr = tmp;
    }
    return prev[bl];
  }

  function similarity(a, b) {
    var maxLen = Math.max(a.length, b.length);
    if (maxLen === 0) return 1;
    return 1 - levenshtein(a, b) / maxLen;
  }

  function ngrams(str, n) {
    var out = [];
    var s = " " + str + " ";
    for (var i = 0; i <= s.length - n; i++) out.push(s.substr(i, n));
    return out;
  }

  global.EOText = {
    stripDiacritics: stripDiacritics,
    normalize: normalize,
    tokenize: tokenize,
    tokenizeMeaningful: tokenizeMeaningful,
    levenshtein: levenshtein,
    similarity: similarity,
    ngrams: ngrams
  };
})(typeof self !== "undefined" ? self : window);
