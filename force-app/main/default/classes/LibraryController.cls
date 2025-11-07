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







}
