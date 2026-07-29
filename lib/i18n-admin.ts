// Shared Amharic strings for the admin/manager surface. Reused across the
// create/edit modals and manager page bodies so common terms (Cancel, Status,
// Title, …) are translated once, not re-declared per file.
// ponytail: one flat dict beats a copy block in every modal. Use with
// pick(lang, a.<key>). Page-specific strings still live in each file.

export const a = {
  // actions / buttons
  cancel: { en: "Cancel", am: "ሰርዝ" },
  close: { en: "Close", am: "ዝጋ" },
  save: { en: "Save", am: "አስቀምጥ" },
  saveChanges: { en: "Save changes", am: "ለውጦችን አስቀምጥ" },
  create: { en: "Create", am: "ፍጠር" },
  edit: { en: "Edit", am: "አርትዕ" },
  delete: { en: "Delete", am: "ሰርዝ" },
  confirm: { en: "Confirm", am: "አረጋግጥ" },
  creating: { en: "Creating…", am: "በመፍጠር ላይ…" },
  saving: { en: "Saving…", am: "በማስቀመጥ ላይ…" },
  deleting: { en: "Deleting…", am: "በመሰረዝ ላይ…" },
  loading: { en: "Loading…", am: "በመጫን ላይ…" },
  search: { en: "Search", am: "ፈልግ" },
  actions: { en: "Actions", am: "እርምጃዎች" },
  view: { en: "View", am: "ይመልከቱ" },

  // common field labels
  title: { en: "Title", am: "ርዕስ" },
  slug: { en: "Slug", am: "ስሉግ" },
  department: { en: "Department", am: "ክፍል" },
  location: { en: "Location", am: "ቦታ" },
  description: { en: "Description", am: "መግለጫ" },
  status: { en: "Status", am: "ሁኔታ" },
  employmentType: { en: "Employment type", am: "የቅጥር አይነት" },
  name: { en: "Name", am: "ስም" },
  email: { en: "Email", am: "ኢሜይል" },
  phone: { en: "Phone", am: "ስልክ" },
  position: { en: "Position", am: "የስራ መደብ" },
  content: { en: "Content", am: "ይዘት" },
  excerpt: { en: "Excerpt", am: "ማጠቃለያ" },
  category: { en: "Category", am: "ምድብ" },
  author: { en: "Author", am: "ደራሲ" },
  date: { en: "Date", am: "ቀን" },
  startDate: { en: "Start date", am: "የመጀመሪያ ቀን" },
  endDate: { en: "End date", am: "የመጨረሻ ቀን" },
  coverImage: { en: "Cover image", am: "ሽፋን ምስል" },

  // status values
  draft: { en: "Draft", am: "ረቂቅ" },
  open: { en: "Open", am: "ክፍት" },
  closed: { en: "Closed", am: "ዝግ" },
  published: { en: "Published", am: "የታተመ" },
  unpublished: { en: "Unpublished", am: "ያልታተመ" },
  active: { en: "Active", am: "ንቁ" },
  inactive: { en: "Inactive", am: "ንቁ ያልሆነ" },

  // misc
  somethingWrong: { en: "Something went wrong", am: "የሆነ ስህተት ተፈጥሯል" },
  noResults: { en: "No results found.", am: "ምንም ውጤት አልተገኘም።" },
} as const
