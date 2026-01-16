## Get started

1. front-end

   ```bash
   npm install
   ```

   ```bash
   npx expo start
   ```

2. back-end
    ```bash
   pip install -r requirements.txt
   ```
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

3. config
개인맞춤으로 설정해주셔야 합니다.
goalkeeper_back/.env 에서 db비밀번호 변경하셔야합니다.

ex)
DB_URL=mysql+pymysql://root:개인비밀번호@localhost:3306/goalkeeper_db

goalkeeper_front/src/app.js 에서 개인 ip로 변경하셔야합니다.

ex)
const BASE_URL = 'http://172.21.250.201:8000'

박정빈 비빈