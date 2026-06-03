# Vu Tru Triet Hoc Mac - Lenin

Ung dung React + Vite mo phong cac khai niem triet hoc Mac - Lenin bang khong gian 3D, animation va cac thuc nghiem tuong tac.

## Noi dung chinh

- **Vat chat**: `The Silent Universe` - vu tru van ton tai va van dong du khong co nguoi quan sat.
- **Y thuc**: `Cosmic Mirror` - y thuc phan anh, xu ly va sang tao tu hien thuc khach quan.
- **Moi lien he & Phat trien**: `He Quy Dao Bien Chung` - keo mot hanh tinh de thay toan he sao bien doi, roi keo thoi gian de thay qua trinh phat trien.
- **Mau thuan & Luong - Chat**: `Loi Sao Bien Chung` - hai luc doi lap trong loi sao tao dong luc, luong tich luy den diem nut tao chat moi.
- **Thuc tien**: `Tram Kiem Nghiem Thuc Tien` - lap gia thuyet, phong robot, kiem nghiem, dieu chinh nhan thuc va cai bien hien thuc.

## Cai dat

```bash
npm install
```

## Chay du an

```bash
npm run dev
```

Mac dinh Vite se mo tai:

```text
http://localhost:5173
```

## Kiem tra

```bash
npm run lint
npm run build
```

## Cau truc quan trong

```text
src/
  components/
    interactives/     # Cac module thuc nghiem tuong tac
    overlays/         # Man hinh chi tiet, quiz, layout popup
    space/            # 3D space scene va cac vat the vu tru
  data/
    cosmos.js         # Du lieu hanh tinh, noi dung bai hoc, quiz
public/
  favicon.png         # Favicon hien tai
  textures/           # Texture dung cho scene 3D
```

## Ghi chu phat trien

- Uu tien de animation va tuong tac truyen tai y nghia, han che text dai trong scene.
- Cac module lon nen giu layout vua man hinh, quiz o goc va khong che len vung tuong tac.
- Sau khi sua UI, nen chay `npm run build` va `npm run lint` truoc khi ban giao.
