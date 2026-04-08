import pageMetaFields from "@/app/lib/config/pageMetaFields";
import { fetchFilteredMagicItems } from "@/app/lib/data/magicitems/fetchFilteredMagicItems";
import isArrayEmpty from "@/app/lib/utils/validators/isArrayEmpty";
import SortableHeader from "../buttons/SortableHeader";
import DeleteButton from "../buttons/DeleteButton";
import ListItem from "@/app/lib/definitions/interfaces/ListItem";
import PageType from "@/app/lib/definitions/types/PageType";
import ModalButton from "../buttons/ModalButton";

export default async function MagicItemsListPage(props: {
  searchParams?: Promise<ListItem>;
}) {
  const magicItems = await fetchFilteredMagicItems(props.searchParams ?? {});

  return (
    <div className="mt-6 flow-root">
      <div className="inline-block min-w-full align-middle">
        <div className="rounded-lg bg-gray-50 p-2 md:pt-0">
          {isArrayEmpty(magicItems) && <p>{"Nessun oggetto magico trovato"}</p>}
          <table className="hidden min-w-full text-gray-900 md:table">
            <thead className="rounded-lg text-left text-sm font-normal">
              <tr>
                <th scope="col" className="px-4 py-5 font-medium sm:pl-6">
                  <SortableHeader
                    label={"Nome"}
                    fieldKey="nome"
                    isFiltrable={false}
                  />
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  <SortableHeader label={"Rarità"} fieldKey="rarita" />
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  <SortableHeader label={"Tipo di oggetto"} fieldKey="tipo" />
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Sintonia
                </th>
                <th
                  scope="col"
                  className="relative py-5 pl-6 pr-3 justify-center flex"
                >
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {magicItems?.map((item) => (
                <tr
                  key={item.id}
                  className="w-full border-b py-3 text-sm last-of-type:border-none [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg"
                >
                  <td className="py-3 pl-6 pr-3">
                    <div className="flex items-center gap-3">
                      <p>{pageMetaFields.nome.getDatum(item.nome)}</p>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    {pageMetaFields.rarita.getDatum(item.rarita)}
                  </td>
                  <td className="px-3 py-3">
                    {pageMetaFields.tipo.getDatum(item.tipo)}
                  </td>
                  <td className="px-3 py-3">
                    {pageMetaFields.sintonia.getDatum(item.sintonia)}
                  </td>
                  <td className="py-3 pl-6 pr-3">
                    <div className="flex justify-end gap-3">
                      <ModalButton
                        buttonLabel={"Modifica"}
                        modalTitle={"Modifica oggetto magico"}
                        modalContent={"magicitemform"}
                        componentProps={{ magicItem: item }}
                      />
                      <DeleteButton
                        pageName={item.nome}
                        pageId={item.id}
                        pageType={PageType.MagicItem}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
