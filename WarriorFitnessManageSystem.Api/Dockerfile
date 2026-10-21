FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY WarriorFitnessManageSystem.Api.csproj .
RUN dotnet restore WarriorFitnessManageSystem.Api.csproj
COPY . .
RUN dotnet publish WarriorFitnessManageSystem.Api.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "WarriorFitnessManageSystem.Api.dll"]