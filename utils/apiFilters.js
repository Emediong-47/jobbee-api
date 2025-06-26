class APIFilters {
    constructor(query, queryString) {
        this.query = query,
        this.queryString = queryString
    }

    filter() {
        const queryCopy = {...this.queryString};

        const removedFields = ['sort', 'fields', 'q', 'limit', 'page'];
        removedFields.forEach(element => delete queryCopy[element]);

        let queryString = JSON.stringify(queryCopy);
        console.log(queryString);
        queryString = queryString.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

        console.log(this.queryString);
        console.log(queryCopy);
        this.query = this.query.find(JSON.parse(queryString));
        return this;
    }
    sort() {
        if(this.queryString.sort) {
            const sortBy = this.queryString.sort.split(",").join(" ");
            this.query = this.query.sort(sortBy);
        } else {
            this.query = this.query.sort("-postingDate");
        }
        return this;
    }
    limitFields() {
        if(this.queryString.fields) {
            const fields = this.queryString.fields.split(",").join(" ");
            this.query = this.query.select(fields);
        } else {
            this.query = this.query.select("-__v");
        }

        return this;
    }
    searchByQuery() {
        if(this.queryString.q) {
            const byQuery = this.queryString.q.split("-").join(" ");
            this.query = this.query.find({$text: {$search: "\""+ byQuery+ "\""}});
        }

        return this;
    }
    pagination() {
        const page = parseInt(this.queryString.page, 10) || 1;
        const limit = parseInt(this.queryString.limit, 10) || 10;
        const skippedResult = (page - 1) * limit;

        this.query = this.query.skip(skippedResult).limit(limit);

        return this;
    }
}

module.exports = APIFilters;