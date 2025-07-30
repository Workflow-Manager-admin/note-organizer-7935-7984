import React, { useState, useEffect, useRef } from "react";
import "./App.css";

/**
 * NotesApp
 * Full-featured minimalistic notes application UI (Create, Edit, Delete, View, Search, Categories/Tags)
 * Uses light theme and a minimal, modern layout with a sidebar, header, and main area. No external UI libraries.
 */

const COLORS = {
  primary: "#1976d2",
  accent: "#ffb300",
  secondary: "#ffffff",
  text: "#282c34",
  border: "#e9ecef"
};

// Generate a random ID for demonstration purposes.
function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

// PUBLIC_INTERFACE
function App() {
  // Notes data: [{id, title, content, category, tags[]}]
  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState(["All", "Work", "Personal", "Ideas"]);
  const [currentCategory, setCurrentCategory] = useState("All");
  const [selectedNote, setSelectedNote] = useState(null); // id
  const [editMode, setEditMode] = useState(false); // is modal open for edit/create
  const [editNote, setEditNote] = useState(null); // note object being edited/created

  // Floating action button reference for focus management
  const fabRef = useRef();

  // Filtered notes based on category/tag and search
  const filteredNotes = notes.filter((n) => {
    // Category match
    let categoryMatch =
      currentCategory === "All" ||
      (n.category || "").toLowerCase() === currentCategory.toLowerCase() ||
      (n.tags || []).map((t) => t.toLowerCase()).includes(currentCategory.toLowerCase());
    // Search match
    let queryMatch =
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase()) ||
      (n.tags || []).some((tag) => tag.toLowerCase().includes(search.toLowerCase()));
    return categoryMatch && queryMatch;
  });

  // Get unique tags from all notes for sidebar display
  const tags = [
    ...new Set(
      notes.flatMap((n) => (n.tags || []).map((t) => t.trim())).filter((t) => t)
    )
  ];

  // Handle selecting a note
  function handleSelectNote(id) {
    setSelectedNote(id);
    setEditMode(false);
  }

  // Handle floating action button click for creating a new note
  function handleCreateNewNote() {
    setEditNote({
      id: "",
      title: "",
      content: "",
      category: "",
      tags: []
    });
    setEditMode(true);
    setSelectedNote(null);
  }

  // Handle editing a note
  function handleEditNote(note) {
    setEditNote({ ...note });
    setEditMode(true);
  }

  // Handle deleting a note
  function handleDeleteNote(id) {
    const confirm = window.confirm("Are you sure you want to delete this note?");
    if (confirm) {
      setNotes((prev) => prev.filter((n) => n.id !== id));
      if (selectedNote === id) setSelectedNote(null);
    }
  }

  // Handle saving a note (create or update)
  function handleSaveNote(note) {
    if (!note.title.trim()) {
      alert("Note title cannot be empty.");
      return;
    }
    let newNotes;
    if (note.id) {
      // Existing note: update
      newNotes = notes.map((n) => (n.id === note.id ? { ...note, tags: note.tags || [] } : n));
    } else {
      // New note
      newNotes = [
        ...notes,
        { ...note, id: generateId(), tags: note.tags || [], category: note.category || "" }
      ];
    }
    // Add category to list if new (except All)
    if (
      note.category &&
      !["All", ...categories.map((c) => c.toLowerCase())].includes(note.category.toLowerCase())
    ) {
      setCategories((prev) => [...prev, note.category]);
    }
    setNotes(newNotes);
    setEditMode(false);
    setEditNote(null);
  }

  // Handle canceling edit/create
  function handleCancelEdit() {
    setEditMode(false);
    setEditNote(null);
    if (fabRef.current) {
      fabRef.current.focus();
    }
  }

  // Handle search input
  function handleSearchInput(e) {
    setSearch(e.target.value);
  }

  // Handle sidebar category/tag selection
  function handleCategorySelect(cat) {
    setCurrentCategory(cat);
    setSelectedNote(null);
  }

  // Demo: Initial data for first load (remove or adjust as needed)
  useEffect(() => {
    if (notes.length === 0) {
      setNotes([
        {
          id: generateId(),
          title: "Welcome to Notes",
          content:
            "Start creating, editing, and organizing your notes! 🚀\nUse the + button to add a new note.",
          category: "Ideas",
          tags: ["intro"]
        },
        {
          id: generateId(),
          title: "Sample Work Note",
          content: "This is an example of a work note. You can tag and organize notes by categories.",
          category: "Work",
          tags: ["project", "work"]
        }
      ]);
    }
    // eslint-disable-next-line
  }, []);

  // Find selected note object
  const selectedNoteObj = notes.find((n) => n.id === selectedNote);

  return (
    <div style={{ minHeight: "100vh", background: COLORS.secondary, color: COLORS.text }}>
      {/* Header */}
      <Header appName="Notes" colors={COLORS} />
      {/* Layout main: sidebar + main content */}
      <div style={{ display: "flex", height: "calc(100vh - 56px)" }}>
        <Sidebar
          categories={categories}
          tags={tags}
          currentCategory={currentCategory}
          onCategorySelect={handleCategorySelect}
          colors={COLORS}
        />
        <main
          style={{
            flex: 1,
            padding: "32px 16px 16px 16px",
            background: "#f4f6fb",
            overflow: "auto",
            minWidth: 0,
            position: "relative"
          }}
        >
          {/* Search bar */}
          <SearchBar value={search} onChange={handleSearchInput} colors={COLORS} />

          {/* Notes list or editor */}
          {editMode ? (
            <NoteEditor
              note={editNote}
              onSave={handleSaveNote}
              onCancel={handleCancelEdit}
              colors={COLORS}
              categories={categories.filter((c) => c !== "All")}
            />
          ) : selectedNoteObj ? (
            <NoteDisplay
              note={selectedNoteObj}
              onEdit={() => handleEditNote(selectedNoteObj)}
              onDelete={() => handleDeleteNote(selectedNoteObj.id)}
              colors={COLORS}
            />
          ) : (
            <NotesList
              notes={filteredNotes}
              onSelect={handleSelectNote}
              colors={COLORS}
            />
          )}

          {/* Floating action button for new note */}
          {!editMode && (
            <button
              aria-label="Add Note"
              ref={fabRef}
              style={fabStyle(COLORS)}
              onClick={handleCreateNewNote}
            >
              +
            </button>
          )}
        </main>
      </div>
    </div>
  );
}

// Header component
function Header({ appName, colors }) {
  return (
    <header
      style={{
        height: 56,
        width: "100%",
        background: colors.primary,
        color: colors.secondary,
        display: "flex",
        alignItems: "center",
        fontWeight: "bold",
        fontSize: 22,
        paddingLeft: 20,
        letterSpacing: 2,
        boxShadow: "0 2px 8px rgba(60, 97, 158, 0.09)"
      }}
    >
      <span style={{ marginRight: 8, fontSize: 24 }}>🗒️</span> {appName}
    </header>
  );
}

// Sidebar component for categories and tags
function Sidebar({ categories, tags, currentCategory, onCategorySelect, colors }) {
  return (
    <aside
      style={{
        width: 220,
        minWidth: 160,
        background: colors.secondary,
        borderRight: `1px solid ${colors.border}`,
        display: "flex",
        flexDirection: "column",
        padding: "20px 8px",
        fontSize: 15
      }}
    >
      <div style={{ fontWeight: "bold", color: colors.primary, marginBottom: 14, fontSize: 17 }}>
        Categories
      </div>
      <nav style={{ marginBottom: 16 }}>
        {categories.map((c) => (
          <SidebarItem
            key={c}
            label={c}
            selected={currentCategory === c}
            accent={colors.accent}
            onClick={() => onCategorySelect(c)}
          />
        ))}
      </nav>
      <div style={{ fontWeight: "bold", color: colors.primary, margin: "10px 0 6px 0", fontSize: 17 }}>
        Tags
      </div>
      <nav>
        {tags.length === 0 && (
          <div style={{ color: "#aaa", fontSize: 14, paddingLeft: 6 }}>None</div>
        )}
        {tags.map((t) => (
          <SidebarItem
            key={t}
            label={t}
            selected={currentCategory === t}
            accent={colors.accent}
            onClick={() => onCategorySelect(t)}
            isTag
          />
        ))}
      </nav>
    </aside>
  );
}

function SidebarItem({ label, selected, accent, onClick, isTag }) {
  return (
    <div
      role="button"
      style={{
        padding: "5px 14px",
        margin: "2px 0",
        borderRadius: 6,
        background: selected ? accent : "transparent",
        color: selected ? "#fff" : "#2b3340",
        fontWeight: selected ? "bold" : 500,
        cursor: "pointer",
        display: "flex",
        alignItems: "center"
      }}
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
      aria-current={selected ? "page" : undefined}
    >
      {isTag && <span style={{ marginRight: 8, fontSize: 15 }}>#</span>}
      {label}
    </div>
  );
}

// Search bar component
function SearchBar({ value, onChange, colors }) {
  return (
    <div style={{ margin: "0 0 20px 0", display: "flex", alignItems: "center" }}>
      <input
        type="text"
        placeholder="Search notes..."
        value={value}
        onChange={onChange}
        style={{
          padding: "7px 14px",
          borderRadius: 8,
          border: `1px solid ${colors.border}`,
          outline: "none",
          fontSize: 15,
          width: 260,
          boxSizing: "border-box",
          marginRight: 8
        }}
      />
      <span aria-label="search" style={{ color: colors.primary, fontSize: 22 }}>🔍</span>
    </div>
  );
}

// Notes list overview
function NotesList({ notes, onSelect, colors }) {
  if (notes.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          color: "#9a9a9a",
          marginTop: 40,
          fontSize: 17,
          letterSpacing: 0.2
        }}
      >
        No notes found. Use the <span style={{ color: colors.primary }}>+</span> button to add your first note.
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: "20px",
        paddingBottom: 36
      }}
    >
      {notes.map((note) => (
        <div
          key={note.id}
          style={{
            background: "#fff",
            border: `1px solid ${colors.border}`,
            borderRadius: 11,
            boxShadow: "0 2px 6px rgba(43, 51, 64, .05)",
            padding: "18px 16px 16px 18px",
            cursor: "pointer",
            transition: "box-shadow .16s",
            minHeight: 100,
            minWidth: 0,
            maxWidth: 370
          }}
          tabIndex={0}
          onClick={() => onSelect(note.id)}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect(note.id)}
        >
          <div style={{ fontWeight: 600, fontSize: 17, marginBottom: 5, color: colors.primary }}>
            {note.title}
          </div>
          <div
            style={{
              fontSize: 14.1,
              color: "#444",
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis"
            }}
            title={note.content.substring(0, 72)}
          >
            {note.content.length > 72
              ? note.content.substring(0, 72) + "…"
              : note.content}
          </div>
          <div style={{ marginTop: 7, display: "flex", gap: "0 12px", flexWrap: "wrap" }}>
            {note.category && (
              <span style={chipStyle(colors.accent)} title="Category">
                {note.category}
              </span>
            )}
            {note.tags &&
              note.tags.slice(0, 3).map(
                (tag) =>
                  tag && (
                    <span key={tag} style={chipStyle(colors.primary)} title="Tag">
                      #{tag}
                    </span>
                  )
              )}
          </div>
        </div>
      ))}
    </div>
  );
}

// Note display and actions
function NoteDisplay({ note, onEdit, onDelete, colors }) {
  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${colors.border}`,
        borderRadius: 12,
        padding: "30px 24px 24px 30px",
        boxShadow: "0 2px 6px rgba(43, 51, 64, .06)",
        maxWidth: 660,
        minWidth: 0,
        margin: "0 auto"
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 25, color: colors.primary, marginBottom: 7 }}>
        {note.title}
      </div>
      <div style={{ marginBottom: 12, color: "#757575", fontSize: 15.2 }}>
        {note.category && (
          <span style={chipStyle(colors.accent)}>
            {note.category}
          </span>
        )}
        {note.tags &&
          note.tags.map((tag) => (
            <span key={tag} style={chipStyle(colors.primary)} title="Tag">
              #{tag}
            </span>
          ))}
      </div>
      <div
        style={{
          fontSize: 16.2,
          color: "#313a4e",
          borderLeft: `3px solid ${colors.accent}`,
          paddingLeft: 14,
          minHeight: 50,
          marginBottom: 25,
          whiteSpace: "pre-wrap"
        }}
      >
        {note.content}
      </div>
      <div style={{ display: "flex", gap: 16 }}>
        <button
          style={buttonStyle(colors.primary)}
          aria-label="Edit"
          onClick={onEdit}
        >
          Edit
        </button>
        <button
          style={buttonStyle("#f44336")}
          aria-label="Delete"
          onClick={onDelete}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

// Note editor (used for both create and edit)
function NoteEditor({ note, onSave, onCancel, colors, categories }) {
  const [title, setTitle] = useState(note.title || "");
  const [content, setContent] = useState(note.content || "");
  const [category, setCategory] = useState(note.category || "");
  const [tags, setTags] = useState(note.tags ? note.tags.join(", ") : "");

  useEffect(() => {
    setTitle(note.title || "");
    setContent(note.content || "");
    setCategory(note.category || "");
    setTags(note.tags ? note.tags.join(", ") : "");
  }, [note]);

  function handleSubmit(e) {
    e.preventDefault();
    onSave({
      ...note,
      title: title.trim(),
      content: content.trim(),
      category: category.trim(),
      tags:
        tags
          ?.split(",")
          .map((t) => t.trim())
          .filter((t) => !!t) || []
    });
  }

  function handleCategoryChange(e) {
    setCategory(e.target.value);
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: "#fff",
        border: `1px solid ${colors.border}`,
        borderRadius: 12,
        padding: "28px 23px 24px 28px",
        maxWidth: 650,
        margin: "0 auto",
        boxShadow: "0 2.8px 12px rgba(43,51,64, .07)"
      }}
      aria-label={note.id ? "Edit note" : "Create note"}
    >
      <div style={{ fontWeight: 600, fontSize: 21, color: colors.primary, marginBottom: 10 }}>
        {note.id ? "Edit Note" : "New Note"}
      </div>
      <label
        htmlFor="title"
        style={{ fontWeight: 500, fontSize: 15, marginBottom: 4, display: "block" }}
      >
        Title
        <input
          id="title"
          type="text"
          value={title}
          autoFocus
          onChange={(e) => setTitle(e.target.value)}
          style={editorInputStyle()}
          maxLength={120}
          required
          aria-required="true"
        />
      </label>
      <label
        htmlFor="content"
        style={{
          fontWeight: 500,
          fontSize: 15,
          margin: "7px 0 4px 0",
          display: "block"
        }}
      >
        Content
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={editorAreaStyle()}
          rows={7}
          maxLength={3000}
          required
        />
      </label>
      <label
        htmlFor="category"
        style={{
          fontWeight: 500,
          fontSize: 15,
          margin: "7px 0 3px 0",
          display: "block"
        }}
      >
        Category
        <input
          id="category"
          type="text"
          value={category}
          list="category-list"
          onChange={handleCategoryChange}
          style={editorInputStyle()}
          maxLength={36}
          placeholder="e.g. Work, Personal"
        />
        <datalist id="category-list">
          {categories.map((cat, idx) => (
            <option key={idx} value={cat} />
          ))}
        </datalist>
      </label>
      <label
        htmlFor="tags"
        style={{
          fontWeight: 500,
          fontSize: 15,
          margin: "7px 0 4px 0",
          display: "block"
        }}
      >
        Tags (comma-separated)
        <input
          id="tags"
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          style={editorInputStyle()}
          maxLength={100}
          placeholder="e.g. work, urgent"
        />
      </label>
      <div style={{ display: "flex", gap: 14, marginTop: 13 }}>
        <button type="submit" style={buttonStyle(colors.primary)}>
          Save
        </button>
        <button
          type="button"
          style={buttonStyle("#aaa")}
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

/* ---------- UI Styles ---------- */

// Floating action button style
function fabStyle(colors) {
  return {
    position: "fixed",
    bottom: 36,
    right: 38,
    zIndex: 24,
    width: 58,
    height: 58,
    borderRadius: "50%",
    background: colors.primary,
    color: "#fff",
    fontSize: 38,
    border: "none",
    boxShadow: "0 2.6px 18px rgba(25, 118, 210, .16)",
    cursor: "pointer",
    transition: "background .17s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    outline: "none"
  };
}

// Button style
function buttonStyle(bg = "#1976d2") {
  return {
    background: bg,
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "8px 20px",
    fontWeight: 600,
    fontSize: 15,
    cursor: "pointer",
    marginRight: 5,
    boxShadow: "0 1.3px 4px rgba(60, 97, 158, .07)"
  };
}

// Tag/chip style
function chipStyle(bg = "#eee") {
  return {
    display: "inline-block",
    background: bg,
    color: "#fff",
    borderRadius: 8,
    padding: "2.5px 10px",
    fontSize: 13.8,
    marginRight: 7,
    marginBottom: 3,
    fontWeight: 500
  };
}

function editorInputStyle() {
  return {
    width: "100%",
    fontSize: 15,
    padding: "7px 11px",
    border: "1px solid #e0e0e0",
    borderRadius: 7,
    marginTop: 3,
    marginBottom: 2,
    background: "#f6faff"
  };
}
function editorAreaStyle() {
  return {
    width: "100%",
    fontSize: 15,
    padding: "9px 11px",
    border: "1px solid #e0e0e0",
    borderRadius: 7,
    marginTop: 3,
    marginBottom: 2,
    background: "#fdfdfd",
    minHeight: 90
  };
}

export default App;
