public with sharing class LibraryController {

    @AuraEnabled(cacheable=true)
    public static List<Book__c> getBooks() {
        return [
            SELECT Id, Name, PublicationYear__c,
                   Author__r.Name,
                   (SELECT Genre__r.Name FROM BookGenre__r)
            FROM Book__c
            ORDER BY Name
        ];
    }

    @AuraEnabled(cacheable=true)
    public static List<Author__c> getAuthors() {
        return [SELECT Id, Name FROM Author__c ORDER BY Name];
    }

    @AuraEnabled(cacheable=true)
    public static List<Genre__c> getGenres() {
        return [SELECT Id, Name FROM Genre__c ORDER BY Name];
    }

    // @AuraEnabled
    // public static Id upsertBook(Book__c bookRecord) {
    //     upsert bookRecord;
    //     return bookRecord.Id;
    // }

    @AuraEnabled
    public static Id upsertAuthor(Author__c authorRecord) {
        upsert authorRecord;
        return authorRecord.Id;
    }

    @AuraEnabled
    public static Id upsertGenre(Genre__c genreRecord) {
        upsert genreRecord;
        return genreRecord.Id;
    }

    @AuraEnabled
    public static void deleteBook(Id bookId) {
        delete [SELECT Id FROM Book__c WHERE Id = :bookId];
    }

    @AuraEnabled
    public static void deleteAuthor(Id authorId) {
        delete [SELECT Id FROM Author__c WHERE Id = :authorId];
    }

    @AuraEnabled
    public static void deleteGenre(Id genreId) {
        delete [SELECT Id FROM Genre__c WHERE Id = :genreId];
    }


    @AuraEnabled
public static Id upsertBook(Book__c bookRecord, List<Id> genreIds) {
    upsert bookRecord;

    delete [SELECT Id FROM BookGenre__c WHERE Book__c = :bookRecord.Id];

    List<BookGenre__c> bgList = new List<BookGenre__c>();
    for(Id gid : genreIds){
        bgList.add(new BookGenre__c(Book__c = bookRecord.Id, Genre__c = gid));
    }
    if(!bgList.isEmpty()) insert bgList;

    return bookRecord.Id;
}


    @AuraEnabled
    public static String getBooksCSVDownloadUrl() {
        List<Book__c> books = [
            SELECT Id, Name, PublicationYear__c,
                   Author__r.Name,
                   (SELECT Genre__r.Name FROM BookGenre__r)
            FROM Book__c
            ORDER BY Name
        ];

        List<String> csvLines = new List<String>();
        csvLines.add('Book Name,Author,Publication Year,Genres');

        for(Book__c b : books) {
            String genres = '';
            if (b.BookGenre__r != null) {
                List<String> gNames = new List<String>();
                for(BookGenre__c bg : b.BookGenre__r) {
                    gNames.add('"' + String.valueOf(bg.Genre__r.Name).replace('"', '""') + '"');
                }
                genres = String.join(gNames, ', ');
            }

            String line = '"' + String.valueOf(b.Name).replace('"','""') + '",' +
                          '"' + String.valueOf(b.Author__r.Name).replace('"','""') + '",' +
                          '"' + String.valueOf(b.PublicationYear__c) + '",' +
                          genres;
            csvLines.add(line);
        }

        String csvString = String.join(csvLines, '\n');

        Blob csvBlob = Blob.valueOf(csvString);
        return EncodingUtil.base64Encode(csvBlob);
}





@AuraEnabled
public static void generateDemoData() {
    if ([SELECT COUNT() FROM Genre__c] == 0) {
        List<Genre__c> genres = new List<Genre__c>{
            new Genre__c(Name = 'Science Fiction'),
            new Genre__c(Name = 'Fantasy'),
            new Genre__c(Name = 'Mystery'),
            new Genre__c(Name = 'Non-Fiction'),
            new Genre__c(Name = 'Romance')
        };
        insert genres;
    }

    if ([SELECT COUNT() FROM Author__c] == 0) {
        List<Author__c> authors = new List<Author__c>{
            new Author__c(Name = 'Isaac Asimov'),
            new Author__c(Name = 'J.K. Rowling'),
            new Author__c(Name = 'Agatha Christie'),
            new Author__c(Name = 'George Orwell'),
            new Author__c(Name = 'Jane Austen')
        };
        insert authors;
    }

    if ([SELECT COUNT() FROM Book__c] == 0) {
        List<Author__c> authors = [SELECT Id FROM Author__c];
        List<Genre__c> genres = [SELECT Id FROM Genre__c];
        List<Book__c> books = new List<Book__c>();

        books.add(new Book__c(Name = 'Foundation', Author__c = authors[0].Id, PublicationYear__c = Date.newInstance(1951,1,1)));
        books.add(new Book__c(Name = 'Harry Potter', Author__c = authors[1].Id, PublicationYear__c = Date.newInstance(1997,1,1)));
        books.add(new Book__c(Name = 'Murder on the Orient Express', Author__c = authors[2].Id, PublicationYear__c = Date.newInstance(1934,1,1)));
        books.add(new Book__c(Name = '1984', Author__c = authors[3].Id, PublicationYear__c = Date.newInstance(1949,1,1)));
        books.add(new Book__c(Name = 'Pride and Prejudice', Author__c = authors[4].Id, PublicationYear__c = Date.newInstance(1813,1,1)));
        insert books;

        List<BookGenre__c> bookGenres = new List<BookGenre__c>();
        for (Book__c b : books) {
            Genre__c randomGenre = genres[Math.mod(Crypto.getRandomInteger(), genres.size())];
            bookGenres.add(new BookGenre__c(Book__c = b.Id, Genre__c = randomGenre.Id));
        }
        insert bookGenres;
    }
}


}
