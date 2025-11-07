import { LightningElement, wire, track } from 'lwc';
import getBooks from '@salesforce/apex/LibraryController.getBooks';
import getAuthors from '@salesforce/apex/LibraryController.getAuthors';
import getGenres from '@salesforce/apex/LibraryController.getGenres';
import upsertBook from '@salesforce/apex/LibraryController.upsertBook';
import upsertAuthor from '@salesforce/apex/LibraryController.upsertAuthor';
import upsertGenre from '@salesforce/apex/LibraryController.upsertGenre';
import deleteBook from '@salesforce/apex/LibraryController.deleteBook';
import deleteAuthor from '@salesforce/apex/LibraryController.deleteAuthor';
import deleteGenre from '@salesforce/apex/LibraryController.deleteGenre';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import getBooksCSVDownloadUrl from '@salesforce/apex/LibraryController.getBooksCSVDownloadUrl';

export default class LibraryManager extends LightningElement {
    @track books;
    @track authors;
    @track genres;

    wiredBooksResult;
    wiredAuthorsResult;
    wiredGenresResult;

    @track currentBookId;
    @track currentBookName = '';
    @track currentBookAuthorId = '';
    @track currentBookYear;
    @track currentBookGenreIds = [];

    isBookModalOpen = false;
    bookModalTitle = 'Add Book';
 
    isAuthorModalOpen = false;
    authorModalTitle = 'Add Author';
    currentAuthorId;
    currentAuthorName = '';

    isGenreModalOpen = false;
    genreModalTitle = 'Add Genre';
    currentGenreId;
    currentGenreName = '';

    bookColumns = [
        { label: 'Book Name', fieldName: 'Name' },
        { label: 'Author', fieldName: 'AuthorName' },
        { label: 'Publication Year', fieldName: 'PublicationYear__c', type: 'date' },
        { label: 'Genres', fieldName: 'Genres' },
        {
            type: 'action',
            typeAttributes: { rowActions: [
                { label: 'Edit', name: 'edit' },
                { label: 'Delete', name: 'delete' }
            ]}
        }
    ];

@wire(getBooks)
wiredBookList(result) {
    this.wiredBooksResult = result;
    if (result.data) {
        const mappedBooks = result.data.map(b => ({
            Id: b.Id,
            Name: b.Name,
            AuthorId: b.Author__c,
            AuthorName: b.Author__r?.Name,
            PublicationYear__c: b.PublicationYear__c,
            Genres: b.BookGenre__r?.map(g => g.Genre__r.Name).join(', '),
            GenreIds: b.BookGenre__r?.map(g => g.Genre__c) || []
        }));
        this.books = mappedBooks;
        this.originalBooks = mappedBooks;  
    }
}

    @wire(getAuthors)
    wiredAuthorList(result) {
        this.wiredAuthorsResult = result;
        if (result.data) this.authors = result.data;
    }

    @wire(getGenres)
    wiredGenreList(result) {
        this.wiredGenresResult = result;
        if (result.data) this.genres = result.data;
    }

    get authorOptions() {
        return this.authors?.map(a => ({ label: a.Name, value: a.Id })) || [];
    }

    get genreOptions() {
        return this.genres?.map(g => ({ label: g.Name, value: g.Id })) || [];
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }

    openAddBookModal() {
        this.bookModalTitle = 'Add Book';
        this.currentBookId = null;
        this.currentBookName = '';
        this.currentBookAuthorId = '';
        this.currentBookYear = null;
        this.currentBookGenreIds = [];
        this.isBookModalOpen = true;
    }

    openEditBookModal(event) {
        const row = event.detail.row;
        this.bookModalTitle = 'Edit Book';
        this.currentBookId = row.Id;
        this.currentBookName = row.Name;
        this.currentBookAuthorId = row.AuthorId;
        this.currentBookYear = row.PublicationYear__c;
        this.currentBookGenreIds = row.GenreIds || [];
        this.isBookModalOpen = true;
    }

    closeBookModal() {
        this.isBookModalOpen = false;
    }

    handleBookNameChange(event) {
        this.currentBookName = event.target.value;
    }

    handleAuthorChange(event) {
        this.currentBookAuthorId = event.detail.value;
    }

    handleBookYearChange(event) {
        this.currentBookYear = event.target.value;
    }

    handleGenreChange(event) {
        this.currentBookGenreIds = event.detail.value;
    }

    async saveBook() {
        const bookRecord = {
            Id: this.currentBookId,
            Name: this.currentBookName,
            Author__c: this.currentBookAuthorId,
            PublicationYear__c: this.currentBookYear
        };
        try {
            await upsertBook({ 
                bookRecord, 
                genreIds: this.currentBookGenreIds 
            });
            this.showToast('Success', 'Book saved', 'success');
            this.closeBookModal();
            refreshApex(this.wiredBooksResult);
        } catch(error) {
            this.showToast('Error', error.body?.message || error.message, 'error');
        }
    }

    async handleRowAction(event) {
        const { action, row } = event.detail;
        if (action.name === 'delete') {
            await deleteBook({ bookId: row.Id });
            this.showToast('Deleted', `Book "${row.Name}" deleted`, 'success');
            refreshApex(this.wiredBooksResult);
        } else if (action.name === 'edit') {
            this.openEditBookModal(event);
        }
    }

    openAddAuthorModal() {
        this.authorModalTitle = 'Add Author';
        this.currentAuthorId = null;
        this.currentAuthorName = '';
        this.isAuthorModalOpen = true;
    }

    openEditAuthorModal(event) {
        const id = event.target.dataset.id;
        const author = this.authors.find(a => a.Id === id);
        this.authorModalTitle = 'Edit Author';
        this.currentAuthorId = id;
        this.currentAuthorName = author?.Name;
        this.isAuthorModalOpen = true;
    }

    closeAuthorModal() {
        this.isAuthorModalOpen = false;
    }

    handleAuthorNameChange(event) {
        this.currentAuthorName = event.target.value;
    }

    async saveAuthor() {
        const record = { Id: this.currentAuthorId, Name: this.currentAuthorName };
        try {
            await upsertAuthor({ authorRecord: record });
            this.showToast('Success', 'Author saved', 'success');
            this.closeAuthorModal();
            refreshApex(this.wiredAuthorsResult);
        } catch(e) {
            this.showToast('Error', e.body?.message || e.message, 'error');
        }
    }

async handleDeleteAuthor(event) {
    const id = event.target.dataset.id;
    try {
        await deleteAuthor({ authorId: id });
        this.showToast('Deleted', 'Author deleted', 'success');

        await refreshApex(this.wiredAuthorsResult);
        await refreshApex(this.wiredBooksResult);

    } catch (error) {
        this.showToast('Error', error.body?.message || error.message, 'error');
        console.error(error);
    }
}




    openAddGenreModal() {
        this.genreModalTitle = 'Add Genre';
        this.currentGenreId = null;
        this.currentGenreName = '';
        this.isGenreModalOpen = true;
    }

    openEditGenreModal(event) {
        const id = event.target.dataset.id;
        const genre = this.genres.find(g => g.Id === id);
        this.genreModalTitle = 'Edit Genre';
        this.currentGenreId = id;
        this.currentGenreName = genre?.Name;
        this.isGenreModalOpen = true;
    }

    closeGenreModal() {
        this.isGenreModalOpen = false;
    }

    handleGenreNameChange(event) {
        this.currentGenreName = event.target.value;
    }

    async saveGenre() {
        const record = { Id: this.currentGenreId, Name: this.currentGenreName };
        try {
            await upsertGenre({ genreRecord: record });
            this.showToast('Success', 'Genre saved', 'success');
            this.closeGenreModal();
            refreshApex(this.wiredGenresResult);
        } catch(e) {
            this.showToast('Error', e.body?.message || e.message, 'error');
        }
    }

    async handleDeleteGenre(event) {
        const id = event.target.dataset.id;
        await deleteGenre({ genreId: id });
        this.showToast('Deleted', 'Genre deleted', 'success');
        refreshApex(this.wiredGenresResult);
    }



async handleExportBooks() {
    try {
        const base64CSV = await getBooksCSVDownloadUrl();

        const dataUrl = 'data:text/csv;base64,' + base64CSV;

        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = 'Books.csv';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.showToast('Success', 'Books exported successfully', 'success');
    } catch (error) {
        console.error(error);
        this.showToast('Error', 'Failed to export books', 'error');
    }
}
   



@track selectedAuthorId = '';
@track selectedGenreId = '';

get authorOptionsWithAll() {
    return [{ label: 'All Authors', value: '' }, ...this.authorOptions];
}

get genreOptionsWithAll() {
    return [{ label: 'All Genres', value: '' }, ...this.genreOptions];
}
handleAuthorFilterChange(event) {
    this.selectedAuthorId = event.detail.value;
    this.filterBooks();
}

handleGenreFilterChange(event) {
    this.selectedGenreId = event.detail.value;
    this.filterBooks();
}

filterBooks() {
    this.books = this.originalBooks.filter(book => {
        const authorMatch = this.selectedAuthorId ? book.AuthorId === this.selectedAuthorId : true;
        const genreMatch = this.selectedGenreId ? book.GenreIds.includes(this.selectedGenreId) : true;
        return authorMatch && genreMatch;
    });
}

}
