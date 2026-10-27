# Setup do Projeto no Ubuntu (Linux)

Siga os passos abaixo após clonar o repositório no Ubuntu.

---

### 1. Pré-requisitos no Ubuntu
Abra o terminal do Ubuntu e instale o Node.js, NPM, Git e MySQL:

```bash
sudo apt update
sudo apt install -y nodejs npm git mysql-server
```

---

### 2. Configurar o MySQL no Ubuntu
Acesse o MySQL como root:

```bash
sudo mysql
```

Execute os seguintes comandos dentro do MySQL:

```sql
CREATE DATABASE IF NOT EXISTS sistema_seguro;
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'aluno';
FLUSH PRIVILEGES;
EXIT;
```

---

### 3. Clonar e Inicializar o Projeto
No terminal do Ubuntu:

```bash
# 1. Clonar o repositório
git clone <URL_DO_SEU_REPOSITORIO> sistema
cd sistema

# 2. Criar o arquivo .env a partir do .env.example
cp .env.example .env

# 3. Instalar as dependências (compilação nativa no Linux)
npm install

# 4. Criar as tabelas no MySQL
npx prisma db push

# 5. Iniciar o servidor
npm start
```

---

### 4. Rodar os Bots (em outros terminais)
```bash
# Terminal 2: Bot Vendedor
node bot_vendedor.js

# Terminal 3: Bot Comprador
node bot_comprador.js
```
