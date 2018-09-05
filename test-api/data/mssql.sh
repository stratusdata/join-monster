
# use latest mssql for linux
docker pull microsoft/mssql-server-linux

# only use a fresh image
docker stop mssql-dev
docker rm mssql-dev

docker run -v "$(pwd)/test-api/data/schema/mssql.sql":/mssql.sql -e ACCEPT_EULA=Y -e SA_PASSWORD=9jaf04xl.3 -p 1433:1433 --name mssql-dev -d microsoft/mssql-server-linux
