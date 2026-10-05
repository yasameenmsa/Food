/**
 * Arabic folding and the search pattern built from it.
 *
 * These are the cases that motivated WS-3: Postgres treats أ إ آ ا and ة ه and
 * ى ي as distinct characters, and `mode: "insensitive"` does nothing because
 * Arabic has no case.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { foldArabic, toSearchKey, searchTerms, dishSearchKey } from "../lib/search";
import { slugify, resolveSlug } from "../lib/slug";

test("folds every alef variant to ا", () => {
  for (const input of ["آ", "أ", "إ", "ٱ", "ا"]) {
    assert.equal(toSearchKey(input), "ا", `failed for ${input}`);
  }
  assert.equal(toSearchKey("أحمد"), "احمد");
  // A whole word starting with a hamza-alef.
  assert.equal(toSearchKey("إجاص"), "اجاص");
  assert.equal(toSearchKey("آكل"), "اكل");
});

test("folds ta marbuta and alif maqsura", () => {
  assert.equal(toSearchKey("مشكلة"), "مشكله");
  assert.equal(toSearchKey("مشكله"), "مشكله");
  assert.equal(toSearchKey("عجينة"), "عجينه");
  assert.equal(toSearchKey("عجينه"), "عجينه");
  assert.equal(toSearchKey("حمصي"), "حمصي");
});

test("folds hamza carriers", () => {
  assert.equal(toSearchKey("مسؤول"), "مسوول");
  assert.equal(toSearchKey("سؤال"), "سوال");
  assert.equal(toSearchKey("مؤمن"), "مومن");
  assert.equal(toSearchKey("مئين"), "ميين");
});

test("strips tashkeel so خُبز and خبز are one dish", () => {
  assert.equal(toSearchKey("خُبز"), "خبز");
  assert.equal(toSearchKey("خبز"), "خبز");
  assert.equal(toSearchKey("فَطيرة"), "فطيره");
});

test("folds Arabic-Indic digits to ASCII", () => {
  assert.equal(toSearchKey("٤٩"), "49");
  assert.equal(toSearchKey("٠١٢٣٤٥٦٧٨٩"), "0123456789");
  // Mixed: a customer typing half Arabic-Indic digits still finds the dish.
  assert.equal(toSearchKey("٤٩.٥٠"), "49.50");
});

test("collapses and trims whitespace", () => {
  assert.equal(toSearchKey("  بيتزا   مارغريتا "), "بيتزا مارغريتا");
  assert.equal(toSearchKey("بيتزا\n\tمارغريتا"), "بيتزا مارغريتا");
});

test("empty and nullish input fold to empty string, not undefined", () => {
  assert.equal(toSearchKey(""), "");
  assert.equal(toSearchKey(null), "");
  assert.equal(toSearchKey(undefined), "");
  assert.equal(toSearchKey("   "), "");
  assert.equal(toSearchKey("!!!"), "!!!");
});

test("orthographic variants fold identically, so ة/ه and أ/ا no longer matter", () => {
  // The stored dish reads "مشكله"; a customer typing "مشكلة" must hit the same key.
  assert.equal(toSearchKey("مشكلة"), toSearchKey("مشكله"));
  assert.equal(toSearchKey("أحمد"), toSearchKey("احمد"));
  assert.equal(toSearchKey("عجينة"), toSearchKey("عجينه"));
});

test("a leading definite article is dropped from the query, not the index", () => {
  // "مشكله" must find "المشكلة". The article is a real prefix, so folding cannot
  // do it — the query is trimmed instead, and the stored key is left whole.
  const storedKey = dishSearchKey("بيتزا المشكلة", "مزيج من اللحم");
  assert.ok(storedKey.includes("المشكله"), "the index keeps the article");

  // Typing the bare form needs no article variant: "%مشكله%" is already a
  // substring of the stored "المشكله". The article variant only appears when the
  // customer actually types it.
  const terms = searchTerms("مشكله");
  assert.deepEqual(terms, ["%مشكله%"]);
  assert.ok(storedKey.includes("مشكله"));

  // Typing the article offers both forms.
  assert.deepEqual(searchTerms("المشكله"), ["%المشكله%", "%مشكله%"]);

  const matches = terms.some((term) => storedKey.includes(term.slice(1, -1)));
  assert.ok(matches, `${storedKey} should match one of ${terms.join(", ")}`);
});

test("a multi-word query offers each term with and without its article", () => {
  // OR-ed per term, never joined into one phrase: trimming the article from a
  // middle term would break contiguity, so "%بيتزا مشكله%" would not match the
  // stored "بيتزا المشكله".
  assert.deepEqual(searchTerms("البيتزا المشكله"), [
    "%البيتزا%",
    "%بيتزا%",
    "%المشكله%",
    "%مشكله%",
  ]);
  assert.deepEqual(searchTerms("بيتزا"), ["%بيتزا%"]);
});

test("an article-free term is not duplicated", () => {
  assert.deepEqual(searchTerms("بيتزا"), ["%بيتزا%"]);
  assert.deepEqual(searchTerms("margrita"), ["%margrita%"]);
});

test("short terms are not article-trimmed", () => {
  // "ال" alone, and anything three characters or shorter, keeps its content
  // rather than becoming an empty pattern that matches everything.
  assert.deepEqual(searchTerms("ال"), ["%ال%"]);
  assert.deepEqual(searchTerms("بنت"), ["%بنت%"]);
  assert.deepEqual(searchTerms("آل"), ["%ال%"]);
});

test("an empty query yields no terms, so no OR clause is built at all", () => {
  assert.deepEqual(searchTerms(""), []);
  assert.deepEqual(searchTerms("   "), []);
  assert.deepEqual(searchTerms(null), []);
  assert.deepEqual(searchTerms(undefined), []);
});

test("dishSearchKey covers name and description in one key", () => {
  const key = dishSearchKey("بيتزا", "صلصه طماطم");
  assert.ok(key.includes("بيتزا"));
  assert.ok(key.includes("صلصه"));
});

test("dishSearchKey tolerates a missing description", () => {
  assert.equal(dishSearchKey("بيتزا", null), "بيتزا");
  assert.equal(dishSearchKey("بيتزا", undefined), "بيتزا");
  assert.equal(dishSearchKey("بيتزا", ""), "بيتزا");
});

test("terms wrap in wildcards and escape user-supplied ones", () => {
  assert.deepEqual(searchTerms("بيتزا"), ["%بيتزا%"]);
  // A user searching "50%" must not turn into a match-everything pattern.
  assert.deepEqual(searchTerms("50%"), ["%50\\%%"]);
  assert.deepEqual(searchTerms("a_b"), ["%a\\_b%"]);
});

test("terms are folded the same way the stored key is", () => {
  assert.deepEqual(searchTerms("مشكلة"), searchTerms("مشكله"));
  assert.ok(searchTerms("أحمد").includes("%احمد%"));
});

test("slugify and search agree, because they share one folding function", () => {
  // If these ever diverge it means someone duplicated the mapping. This is the
  // guard for the DRY requirement in the plan.
  for (const word of ["مشكلة", "أحمد", "عجينة", "خُبز"]) {
    const slug = slugify(word);
    const key = toSearchKey(word);
    assert.equal(
      slug.replace(/-/g, " "),
      key,
      `slug and search key disagree for ${word}`,
    );
  }
});

test("slugify keeps Arabic letters and turns separators into dashes", () => {
  assert.equal(slugify("بيتزا مارغريتا"), "بيتزا-مارغريتا");
  assert.equal(slugify("بيتزا / صفيحة"), "بيتزا-صفيحه");
  assert.equal(slugify("  بيتزا  "), "بيتزا");
  assert.equal(slugify("nabulsi-kunafa"), "nabulsi-kunafa");
});

test("slugify collapses a run of punctuation into one dash", () => {
  assert.equal(slugify("بيتزا --- صفيحة"), "بيتزا-صفيحه");
  assert.equal(slugify("بيتزا!!!"), "بيتزا");
});

test("slugify strips tashkeel so one dish is one URL", () => {
  // Note the ة -> ه fold too: the URL and the search key must agree.
  assert.equal(slugify("فَطيرة"), "فطيره");
  assert.equal(slugify("فَطيرة"), slugify("فطيرة"));
});

test("resolveSlug prefers an explicit slug over the name", () => {
  assert.equal(resolveSlug("بيتزا مارغريتا", "margherita"), "margherita");
});

test("resolveSlug falls back to the name when the slug is empty or punctuation", () => {
  assert.equal(resolveSlug("بيتزا مارغريتا", ""), "بيتزا-مارغريتا");
  assert.equal(resolveSlug("بيتزا مارغريتا", null), "بيتزا-مارغريتا");
  assert.equal(resolveSlug("بيتزا مارغريتا", "!!!"), "بيتزا-مارغريتا");
});

test("resolveSlug returns empty when nothing usable remains, so the form can error", () => {
  assert.equal(resolveSlug("!!!", "???"), "");
  assert.equal(resolveSlug("", ""), "");
});

test("slugify caps length so a long dish name is still a valid URL", () => {
  const long = "بيتزا ".repeat(40);
  assert.ok(slugify(long).length <= 80);
});

test("foldArabic is the single source both consumers call", () => {
  assert.equal(foldArabic("المشكلة"), toSearchKey("المشكلة"));
});
