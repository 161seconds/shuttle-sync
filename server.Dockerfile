FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY Directory.Build.props ./
COPY ShuttleSync.Repository/ShuttleSync.Repository.csproj ShuttleSync.Repository/
COPY ShuttleSync.Service/ShuttleSync.Service.csproj ShuttleSync.Service/
COPY ShuttleSync.API/ShuttleSync.API.csproj ShuttleSync.API/
RUN dotnet restore ShuttleSync.API/ShuttleSync.API.csproj
COPY ShuttleSync.Repository/ ShuttleSync.Repository/
COPY ShuttleSync.Service/ ShuttleSync.Service/
COPY ShuttleSync.API/ ShuttleSync.API/
RUN dotnet publish ShuttleSync.API/ShuttleSync.API.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app ./
ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 5000
USER $APP_UID
ENTRYPOINT ["dotnet", "ShuttleSync.API.dll"]
