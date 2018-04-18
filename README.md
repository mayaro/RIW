To be able to have a complete indexing process run the following steps:

1. install mongo, either locally on a docker container (you might want to use docker volume when running the container).
2. modify `master.js` to point to the relative path of the date files directory.
3. modify `child.js` to wnsure a valid mongodb connection string
4. run `node master.js` (teh master process will start a number of workers equal to the number of CPU's on the machine - 1);

To start the search server modify the server port in `search-server.js` if neccessary and run `node search-server.js`.

! Also note that both the search-server and the indexing pipeline were tested on the latest version of node, `9.11.1` at this time.