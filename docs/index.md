# Library Manager LWC Project

This Salesforce Lightning Web Component (LWC) project is a **Library Manager** that allows users to manage books, authors, and genres efficiently. It provides a modern interface with full CRUD operations, data export, and sorting capabilities.

---

## Features

- **Add, Edit, and Delete Books**  
  Users can create new books, update existing ones, or remove books from the library.

- **Manage Authors**  
  Add, edit, and delete authors associated with books.

- **Manage Genres**  
  Add, edit, and delete genres for better classification of books.

- **Export Books**  
  Users can export all books to CSV for offline use.

- **Sort and Filter**  
  Sort books by author or genre to quickly find the desired records.

---

## Components

- **Book Management LWC**  
  Handles all operations related to books.

- **Author Management LWC**  
  Handles CRUD operations for authors.

- **Genre Management LWC**  
  Handles CRUD operations for genres.

- **Export & Sorting Functionality**  
  Buttons and comboboxes allow users to export data and sort by author or genre.

---

## Live Demo

You can try the Library Manager **directly in my Salesforce org**:  
[Open in Salesforce Org](https://brave-bear-35nx4h-dev-ed.trailblaze.lightning.force.com/lightning/n/Library)

> ⚠️ Note: If you want to install this project in your own Salesforce org, all objects used in this project have been exported for easy deployment.

---

## Installation

1. Clone the repository:

```bash
git clone https://github.com/username/Library.git

Deploy lwc, apex and objects metadata to your org


Relationships Overview

Book → Author: Master-Detail relationship; each book belongs to one author.

BookGenre → Book & Genre: Master-Detail relationships; a book can belong to multiple genres.

Author & Genre: Independent objects linked to Book via Master-Detail or BookGenre.

<img src="https://drive.google.com/uc?export=view&id=1Bb-_g0Fnlxfsb9iXcfq2UONxpPAMtcDH" style="width:600px;">
