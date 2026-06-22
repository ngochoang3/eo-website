/*! EO Studio Chatbot — synonym & intent keyword dictionary (data only, no logic) */
(function (global) {
  "use strict";

  // All keys/values stored already diacritic-stripped + lowercase (see text-utils.normalize)
  // so matching against a normalized query is a plain array.includes / token check.

  var INTENT_KEYWORDS = {
    class: ["class", "lop", "nghe", "nghe nghiep", "nhan vat"],
    boss: ["boss", "trum", "vua", "chua te", "thu lanh", "ong trum"],
    monster: ["monster", "quai", "quai vat", "con vat", "ke thu", "mob"],
    npc: ["npc", "thuong nhan", "nguoi ban", "ban hang", "merchant", "vendor"],
    item: ["item", "vat pham", "do", "trang bi", "do vat"],
    equipment: ["equipment", "trang bi", "vu khi", "ao giap", "giap", "weapon", "armor"],
    skill: ["skill", "ky nang", "chieu", "phep"],
    quest: ["quest", "nhiem vu", "task"],
    map: ["map", "ban do", "vung", "khu vuc", "world", "the gioi", "region", "biome"],
    drop: ["drop", "roi", "roi ra", "ro", "ruot", "loot", "phan thuong roi"],
    shop: ["shop", "cua hang", "tiem", "ban gi", "mua"],
    craft: ["craft", "che tao", "ren", "lam ra", "nau"],
    dungeon: ["dungeon", "ham ngam", "hang dong", "instance"],
    tutorial: ["tutorial", "huong dan", "bat dau", "moi choi"],
    patchnote: ["patch", "cap nhat", "ban cap nhat", "thay doi gi", "update"],
    faq: ["faq", "cau hoi thuong gap"],
    levelRequirement: ["level", "cap do", "yeu cau", "mo khoa", "can level may"]
  };

  // canonical-name -> [alias, alias, ...] all normalized
  var ENTITY_ALIASES = {
    "slime king": ["vua slime", "boss slime", "slime king boss"],
    "boss": ["trum", "vua", "chua te", "thu linh", "ong trum", "boss"]
  };

  function buildAliasLookup() {
    var lookup = {};
    Object.keys(ENTITY_ALIASES).forEach(function (canon) {
      var canonNorm = window.EOText.normalize(canon);
      lookup[canonNorm] = canonNorm;
      ENTITY_ALIASES[canon].forEach(function (alias) {
        lookup[window.EOText.normalize(alias)] = canonNorm;
      });
    });
    return lookup;
  }

  global.EOSynonyms = {
    INTENT_KEYWORDS: INTENT_KEYWORDS,
    ENTITY_ALIASES: ENTITY_ALIASES,
    buildAliasLookup: buildAliasLookup
  };
})(window);
